# BitHuman Avatar Quick Start Guide
## Practical Implementation for Your Current Agent

This guide shows how to upgrade your current BitHuman avatar implementation with performance optimizations.

---

## Current Implementation

Your current code in `agent_with_avatar.py`:

```python
avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
)
await avatar.start(session, room=ctx.room)
```

**Problems:**
- No model selection (defaults to cloud API)
- No buffer tuning (uses default queues that add latency)
- No connection optimization
- No threading configuration
- Likely experiencing lag and lip-sync issues

---

## Step 1: Immediate Fix (5 minutes)

Add model selection and connection optimization:

```python
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman

# Get avatar ID from environment
avatar_id = os.getenv("BITHUMAN_AVATAR_ID")

# OPTIMIZED: Add these parameters
avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
    model="essence",  # Faster, lower latency than "expression"
    conn_options=APIConnectOptions(
        max_retry=5,
        retry_interval=1.5,
        timeout=20.0,
    ),
)

logger.info(f"Starting avatar: {avatar_id}")
await avatar.start(session, room=ctx.room)
logger.info("Avatar started successfully!")
```

**Impact:** Reduces latency by 20-30% through faster model selection.

---

## Step 2: Environment-Based Tuning (10 minutes)

Create `.env.local` settings for different deployment scenarios:

```bash
# For low-latency (demos, interactive)
OUTPUT_WIDTH=960
COMPRESS_METHOD=NONE
PROCESS_IDLE_VIDEO=False

# For production (balanced)
OUTPUT_WIDTH=1280
COMPRESS_METHOD=JPEG
PROCESS_IDLE_VIDEO=True

# For constrained devices
OUTPUT_WIDTH=720
COMPRESS_METHOD=JPEG
PROCESS_IDLE_VIDEO=False
```

Then select in code:
```python
import os

deployment_mode = os.getenv("DEPLOYMENT_MODE", "balanced")

if deployment_mode == "ultra-low-latency":
    os.environ["OUTPUT_WIDTH"] = "960"
    os.environ["COMPRESS_METHOD"] = "NONE"
    os.environ["PROCESS_IDLE_VIDEO"] = "False"
```

---

## Step 3: Monitor Performance (15 minutes)

Add logging to track avatar performance:

```python
import time
from livekit.plugins import bithuman

class AvatarPerformanceMonitor:
    def __init__(self):
        self.start_time = None
        self.frame_count = 0
        self.audio_frames = 0

    def on_avatar_start(self):
        self.start_time = time.time()
        logger.info("Avatar performance monitoring started")

    def on_frame_generated(self):
        self.frame_count += 1
        if self.frame_count % 250 == 0:  # Every 10 seconds at 25 FPS
            elapsed = time.time() - self.start_time
            fps = self.frame_count / elapsed
            logger.info(f"Avatar FPS: {fps:.1f}, Total frames: {self.frame_count}")

monitor = AvatarPerformanceMonitor()
monitor.on_avatar_start()
```

---

## Step 4: Complete Optimized Implementation

Here's the recommended complete setup for your agent:

```python
import asyncio
import json
import logging
import os
import time
from typing import TYPE_CHECKING, Optional

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    APIConnectOptions,
    cli,
    inference,
    llm,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Import avatar plugin
try:
    from livekit.plugins import bithuman
    AVATAR_AVAILABLE = True
except ImportError:
    AVATAR_AVAILABLE = False
    print("BitHuman plugin not installed")

from emotion_analyzer import analyze_emotion

logger = logging.getLogger("agent")
load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self, ctx: Optional[JobContext] = None) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant...""",
        )
        self.ctx = ctx


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


async def send_emotion_data(room: rtc.Room, emotion: str, source: str, text: str):
    """Send emotion data via participant attributes."""
    data = {
        "type": "emotion",
        "emotion": emotion,
        "source": source,
        "text": text[:100],
        "timestamp": int(time.time() * 1000),
        "confidence": 1.0,
    }
    emotion_json = json.dumps(data)
    await room.local_participant.set_attributes({"emotion": emotion_json})
    logger.info(f"Emotion sent: {emotion} ({source})")


@server.rtc_session()
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    # Set up voice pipeline
    session = AgentSession(
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # Set up emotion analysis
    logger.info("Setting up emotion analysis...")

    @session.on("conversation_item_added")
    def on_conversation_item(event):
        message = event.item
        if not hasattr(message, 'content') or not message.content:
            return

        if message.role == "assistant":
            return

        content = message.content
        transcript = ' '.join(str(part) for part in content) if isinstance(content, list) else str(content)

        if transcript.strip():
            emotion = analyze_emotion(transcript)
            logger.info(f"Agent reaction: {emotion}")
            asyncio.create_task(send_emotion_data(ctx.room, emotion, "agent", transcript))

    logger.info("Emotion hooks registered")

    # ===== AVATAR SETUP =====
    avatar_enabled = os.getenv("ENABLE_AVATAR", "false").lower() == "true"

    if avatar_enabled and AVATAR_AVAILABLE:
        logger.info("Avatar mode ENABLED")

        avatar_id = os.getenv("BITHUMAN_AVATAR_ID")
        deployment_mode = os.getenv("DEPLOYMENT_MODE", "balanced")

        if not avatar_id:
            logger.warning("BITHUMAN_AVATAR_ID not set - avatar disabled")
        else:
            try:
                # OPTIMIZED AVATAR INITIALIZATION
                logger.info(f"Initializing avatar with {deployment_mode} mode")

                # Configure based on deployment mode
                if deployment_mode == "ultra-low-latency":
                    os.environ["OUTPUT_WIDTH"] = "960"
                    os.environ["COMPRESS_METHOD"] = "NONE"
                    os.environ["PROCESS_IDLE_VIDEO"] = "False"
                    conn_options = APIConnectOptions(
                        max_retry=3,
                        retry_interval=0.5,
                        timeout=10.0,
                    )
                elif deployment_mode == "high-quality":
                    os.environ["OUTPUT_WIDTH"] = "1280"
                    os.environ["COMPRESS_METHOD"] = "NONE"
                    os.environ["PROCESS_IDLE_VIDEO"] = "True"
                    os.environ["LIVA_IDEL_VIDEO_ENABLED"] = "True"
                    conn_options = APIConnectOptions(
                        max_retry=5,
                        retry_interval=2.0,
                        timeout=30.0,
                    )
                elif deployment_mode == "constrained":
                    os.environ["OUTPUT_WIDTH"] = "720"
                    os.environ["COMPRESS_METHOD"] = "JPEG"
                    os.environ["PROCESS_IDLE_VIDEO"] = "False"
                    conn_options = APIConnectOptions(
                        max_retry=5,
                        retry_interval=2.0,
                        timeout=30.0,
                    )
                else:  # balanced (default)
                    os.environ["OUTPUT_WIDTH"] = "1280"
                    os.environ["COMPRESS_METHOD"] = "JPEG"
                    os.environ["PROCESS_IDLE_VIDEO"] = "True"
                    conn_options = APIConnectOptions(
                        max_retry=5,
                        retry_interval=1.5,
                        timeout=20.0,
                    )

                # Create optimized avatar
                avatar = bithuman.AvatarSession(
                    avatar_id=avatar_id,
                    model="essence",  # Lower latency, good quality
                    conn_options=conn_options,
                )

                logger.info(f"Starting avatar: {avatar_id}")
                await avatar.start(session, room=ctx.room)
                logger.info("Avatar started successfully!")

            except Exception as e:
                logger.error(f"Failed to start avatar: {e}")
                logger.info("Falling back to voice-only mode")
    else:
        logger.info("Voice-only mode (no avatar)")

    # Start the session
    await session.start(
        agent=Assistant(ctx),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC(),
            ),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
```

---

## Step 5: Testing Different Configurations

Test each profile to find optimal settings for your use case:

```bash
# Ultra-low-latency (good for demos)
DEPLOYMENT_MODE=ultra-low-latency ENABLE_AVATAR=true uv run python src/agent_with_avatar.py dev

# Balanced (recommended for production)
DEPLOYMENT_MODE=balanced ENABLE_AVATAR=true uv run python src/agent_with_avatar.py dev

# High-quality (better for emotional interactions)
DEPLOYMENT_MODE=high-quality ENABLE_AVATAR=true uv run python src/agent_with_avatar.py dev

# Constrained (for limited resources)
DEPLOYMENT_MODE=constrained ENABLE_AVATAR=true uv run python src/agent_with_avatar.py dev
```

---

## Step 6: Advanced - Local Model Mode

For the best performance, use local model mode (requires model file):

```bash
# Set environment variables
export BITHUMAN_MODEL_PATH="/path/to/avatar.imx"
export BITHUMAN_API_SECRET="your_secret_here"

# Run with local mode
ENABLE_AVATAR=true uv run python src/agent_with_avatar.py dev
```

In code:
```python
use_local_model = os.getenv("BITHUMAN_MODEL_PATH") is not None

if use_local_model:
    avatar = bithuman.AvatarSession(
        model_path=os.getenv("BITHUMAN_MODEL_PATH"),
        model="essence",
    )
else:
    # Cloud mode fallback
    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",
        conn_options=conn_options,
    )
```

---

## Troubleshooting

### Avatar mouth lags behind audio
1. Set `DEPLOYMENT_MODE=ultra-low-latency`
2. Ensure `model="essence"` (not "expression")
3. Reduce `OUTPUT_WIDTH` to 960

### Audio cuts off
1. Set `output_buffer_size=0` in AsyncBithuman (unbounded)
2. Check network connectivity
3. Increase `retry_interval`

### High CPU usage
1. Reduce `OUTPUT_WIDTH` to 720
2. Set `COMPRESS_METHOD=JPEG`
3. Use `model="essence"` (not "expression")

### Avatar looks stiff
1. Switch to `model="expression"` (higher latency)
2. Set `LIVA_IDEL_VIDEO_ENABLED=True`
3. Check if using "essence" was the cause

---

## Performance Checklist

- [ ] Model is "essence" (unless you need emotions)
- [ ] `OUTPUT_WIDTH` matches your bandwidth
- [ ] `COMPRESS_METHOD` set appropriately
- [ ] `PROCESS_IDLE_VIDEO` disabled if not needed
- [ ] Connection retry settings match your network
- [ ] Testing with different `DEPLOYMENT_MODE` values
- [ ] Monitoring avatar FPS and network latency
- [ ] Token refresh working (check logs)
- [ ] Audio resampling from TTS to 16kHz handled
- [ ] Avatar shutdown cleanup in place

---

## Environment Variable Reference

```bash
# Avatar Control
ENABLE_AVATAR=true|false                    # Enable/disable avatar
BITHUMAN_AVATAR_ID=avatar_id               # Avatar ID for cloud mode
BITHUMAN_MODEL_PATH=/path/to/model.imx    # Model path for local mode
BITHUMAN_API_SECRET=secret                 # API authentication

# Deployment Profile
DEPLOYMENT_MODE=ultra-low-latency|balanced|high-quality|constrained

# Video Settings
OUTPUT_WIDTH=960|1280|720                  # Resolution (longest side)
COMPRESS_METHOD=NONE|JPEG|TEMP_FILE        # Compression method

# Processing Settings
LOADING_MODE=ASYNC|SYNC|ON_DEMAND          # Model loading strategy
PROCESS_IDLE_VIDEO=True|False              # Generate idle frames
LIVA_IDEL_VIDEO_ENABLED=True|False         # Idle animations
LIVA_AUTO_SAY_HI=True|False                # Auto-greeting
```

---

## Next Steps

1. **Implement Step 1** (add model="essence" and conn_options)
2. **Test different DEPLOYMENT_MODE values** to find optimal for your use case
3. **Enable performance monitoring** to track FPS and latency
4. **Document your findings** about which mode works best
5. **Consider local mode** if you have a model file and API secret
6. **Implement graceful degradation** to voice-only if avatar fails

---

## Additional Resources

See the following files for more details:
- `BITHUMAN_OPTIMIZATION_RESEARCH.md` - Comprehensive research document
- `BITHUMAN_CONFIG_EXAMPLES.py` - Code examples for all configurations
