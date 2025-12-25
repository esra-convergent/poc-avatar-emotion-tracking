# BitHuman Avatar Optimization Research
## LiveKit Agents Plugin Configuration Analysis

**Research Date:** December 2025
**Scope:** BitHuman avatar plugin for LiveKit agents, performance optimization, and synchronization issues

---

## Table of Contents
1. [Common Causes of Lag and Poor Lip-Sync](#1-common-causes-of-lag-and-poor-lip-sync)
2. [Configuration Options for Performance](#2-configuration-options-for-performance)
3. [Best Practices for Optimization](#3-best-practices-for-optimization)
4. [Alternative Configuration Parameters](#4-alternative-configuration-parameters)
5. [Known Issues with Synchronization](#5-known-issues-with-synchronization)
6. [Optimization Recommendations for Your Implementation](#6-optimization-recommendations-for-your-implementation)

---

## 1. Common Causes of Lag and Poor Lip-Sync

### A. Audio-Video Synchronization Issues

1. **Buffer Size Mismatch**
   - Audio buffering configurations not aligned with video frame timing
   - Async frame processing delays between audio chunks and video frames
   - Default `output_buffer_size=5` may cause frame drops or jitter

2. **Sample Rate Misalignment**
   - BitHuman expects **16kHz mono audio** at INPUT_SAMPLE_RATE (16,000 Hz)
   - LiveKit Cartesia TTS uses 24kHz by default
   - Resampling overhead without proper configuration adds latency
   - Audio chunk duration must align with video frame duration

3. **Frame Timing Calculations**
   - Audio frames per video frame = `INPUT_SAMPLE_RATE / FPS` = `16000 / 25 = 640 samples per frame`
   - Misaligned audio batching causes lip-sync drift
   - Processing idle video frames (`PROCESS_IDLE_VIDEO=True`) without audio causes visual stuttering

### B. Network and Latency Issues

1. **API Connection Overhead**
   - Cloud mode requires HTTP requests to BitHuman API for token/session initialization
   - Default timeout: `sock_connect` timeout (see `APIConnectOptions`)
   - Retry logic with `max_retry=3` and `retry_interval=1.0s` adds startup latency
   - Network jitter affects real-time frame delivery

2. **Token Expiration During Stream**
   - Tokens have limited lifetime; expiration causes stream interruption
   - Token refresh overhead during active conversation
   - Model hash calculation delays on startup

### C. Processing Performance

1. **CPU Bottlenecks**
   - Single-threaded processing (`num_threads=0`) default cannot leverage multi-core systems
   - Video encoding compression (`COMPRESS_METHOD="JPEG"`) adds CPU overhead
   - Model loading mode (`LOADING_MODE="ASYNC"`) may have variable performance

2. **Model Selection Impact**
   - "expression" model: Dynamic emotional responses, higher CPU/latency cost
   - "essence" model: Predefined gestures, lower latency but less responsive
   - Model path resolution and validation adds startup time

### D. Video Quality Settings

1. **Resolution and FPS Trade-offs**
   - Fixed 25 FPS output (not configurable in current version)
   - `OUTPUT_WIDTH=1280` determines output resolution (longest side)
   - Higher resolution = higher bandwidth and CPU requirements
   - Video scaling during conversion can introduce delay

---

## 2. Configuration Options for Performance

### A. AvatarSession Initialization Parameters

The `AvatarSession` class provides these optimization parameters:

```python
AvatarSession(
    # Core Configuration
    avatar_id: str,                              # Pre-configured avatar ID
    avatar_image: Optional[str | Image.Image],  # Custom avatar image
    model: Literal["expression", "essence"],    # "essence" = faster, lower latency

    # Authentication
    api_secret: str,           # BitHuman API authentication
    api_token: str,            # Alternative token-based auth
    api_url: str,              # Default: https://auth.api.bithuman.ai/v1/runtime-tokens/request

    # Local Mode Configuration
    model_path: str,           # Path to .imx model file for local processing

    # Connection Options
    conn_options: APIConnectOptions,  # max_retry, retry_interval, timeout

    # Participant Identity
    avatar_participant_identity: str,  # Default: "bithuman-avatar-agent"
    avatar_participant_name: str,      # Default: "bithuman-avatar-agent"
)
```

**Key Discovery:** The current implementation is very basic:
```python
avatar = bithuman.AvatarSession(avatar_id=avatar_id)
await avatar.start(session, room=ctx.room)
```

Missing many optimization parameters!

### B. AsyncBithuman Runtime Parameters (Local Mode)

For local model processing, the underlying runtime accepts:

```python
runtime = await AsyncBithuman.create(
    model_path: str,                    # Path to avatar model
    api_secret: str,                    # Required for token generation
    api_token: str,                     # Alternative auth

    # BUFFER TUNING - Critical for lip-sync
    input_buffer_size: int = 0,         # Audio input queue size (0 = unbounded)
    output_buffer_size: int = 5,        # Video frame queue size (affects latency)

    # PERFORMANCE TUNING
    num_threads: int = 0,               # 0 = single-threaded
                                        # >0 = specific thread count
                                        # <0 = auto-detect optimal

    # API Configuration
    api_url: str,                       # Token request endpoint
    tags: str = "bithuman",             # Request tags for API
    insecure: bool = True,              # SSL verification (not recommended for prod)
)
```

**Critical Parameters for Optimization:**
- `output_buffer_size=5`: Default may be too high, causing frame queue delays
- `num_threads`: Should be tuned based on CPU cores available
- `input_buffer_size=0`: Unbounded input prevents backpressure issues

### C. Configuration Settings (config.py)

These settings are loaded at runtime and affect performance:

```python
# Video Processing
OUTPUT_WIDTH: int = 1280              # Output resolution (longest side)
FPS: int = 25                         # Fixed frame rate (not configurable)
COMPRESS_METHOD: str = "JPEG"         # "NONE", "JPEG", or "TEMP_FILE"
LOADING_MODE: str = "ASYNC"           # "SYNC", "ASYNC", or "ON_DEMAND"
PROCESS_IDLE_VIDEO: bool = True       # Generate frames when no audio input
EXTRACT_WORKSPACE_TO_LOCAL: bool = False  # Extract model to local workspace

# Audio Processing
INPUT_SAMPLE_RATE: int = 16_000       # Fixed at 16kHz (not configurable)

# Idle Video Behavior
LIVA_IDEL_VIDEO_ENABLED: bool = True  # Enable idle animations
LIVA_AUTO_SAY_HI: bool = False        # Auto-greet feature
```

**Environment Variable Overrides:**
These can be set in `.env` or environment:
```bash
OUTPUT_WIDTH=960                      # Lower resolution = less bandwidth
COMPRESS_METHOD=NONE                  # Skip compression if bandwidth available
LOADING_MODE=ON_DEMAND                # Load video data only when needed
PROCESS_IDLE_VIDEO=False              # Skip processing when silent
EXTRACT_WORKSPACE_TO_LOCAL=True       # Cache extracted models locally
```

### D. AvatarOptions (Video Generator Output)

The avatar runner uses these options:

```python
avatar_options = AvatarOptions(
    video_width: int,          # From video_generator.video_resolution
    video_height: int,         # Automatically calculated
    video_fps: float,          # From video_generator.video_fps (25.0)
    audio_sample_rate: int,    # From runtime.settings.INPUT_SAMPLE_RATE (16000)
    audio_channels: int = 1,   # Mono audio (not configurable)
)
```

**Current Implementation Details (from avatar.py):**
```python
output_width, output_height = video_generator.video_resolution
avatar_options = AvatarOptions(
    video_width=output_width,
    video_height=output_height,
    video_fps=video_generator.video_fps,      # = 25.0
    audio_sample_rate=video_generator.audio_sample_rate,  # = 16000
    audio_channels=1,
)
```

---

## 3. Best Practices for Optimization

### A. Model Selection Strategy

| Strategy | Model | Latency | Quality | CPU | Use Case |
|----------|-------|---------|---------|-----|----------|
| **Responsive** | expression | Higher | Higher | Higher | Emotional reactions, nuanced responses |
| **Fast** | essence | Lower | Adequate | Lower | High-throughput, real-time conversations |
| **Balanced** | essence | Optimal | Good | Balanced | Standard deployments |

**Recommendation:** Start with "essence" model for lower latency:
```python
avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
    model="essence"  # Lower latency, faster responses
)
```

### B. Buffer Configuration Optimization

**Current Default (High Latency Risk):**
```python
output_buffer_size: int = 5  # 5 frames = 200ms at 25 FPS
```

**Optimized Configurations:**

1. **Low-Latency Streaming** (real-time conversation priority)
   ```python
   output_buffer_size=2  # ~80ms buffering, less jitter tolerance
   input_buffer_size=0   # Unbounded audio input
   ```

2. **Stable Streaming** (balanced approach)
   ```python
   output_buffer_size=3  # ~120ms buffering
   input_buffer_size=2   # Small audio queue
   ```

3. **High-Bandwidth Streams** (quality priority)
   ```python
   output_buffer_size=5  # ~200ms buffering, more robust
   input_buffer_size=5   # Larger audio queue
   ```

### C. Audio-Video Synchronization

**Critical Calculations:**
- Frame duration: 1/25 = 40ms per video frame
- Audio samples per frame: 16000 Hz / 25 FPS = 640 samples
- Audio duration per frame: 640 / 16000 = 40ms

**Audio Chunk Size Optimization:**
```python
# Ensure audio chunks align with frame boundaries
# Optimal chunk size: 640 samples = 40ms (1 video frame)
# or multiples: 1280 (2 frames), 1920 (3 frames), etc.

# When receiving audio from LiveKit:
# LiveKit default: 20ms chunks
# BitHuman optimal: 40ms chunks (align to video frame)
# Solution: Batch 2 LiveKit audio chunks before sending
```

### D. Network Configuration

```python
conn_options=APIConnectOptions(
    max_retry=5,              # Higher for unstable networks
    retry_interval=2.0,       # Longer wait between retries
    timeout=30.0,             # Longer timeout for slow networks
)
```

### E. Threading Strategy

```python
# Single-threaded (default, lowest overhead)
num_threads=0

# Auto-detect optimal threads (recommended for CPU-intensive)
num_threads=-1

# Fixed thread count (tuning required)
# 4 cores: num_threads=2-3
# 8 cores: num_threads=4-6
num_threads=4
```

### F. Compression Strategy

| Setting | Bandwidth | CPU | Latency | Use Case |
|---------|-----------|-----|---------|----------|
| JPEG | Low | Medium | Slight increase | Bandwidth-constrained |
| NONE | High | Low | Lowest | Low-latency, unconstrained |
| TEMP_FILE | Low | High | Higher | Not recommended |

**Recommendation:** Use COMPRESS_METHOD=NONE for real-time conversations with sufficient bandwidth.

### G. Model Loading Strategy

| Mode | Load Time | Memory | Performance | Use Case |
|------|-----------|--------|-------------|----------|
| SYNC | Slow | High | Stable | Pre-load during startup |
| ASYNC | Medium | High | Smooth | Default, good balance |
| ON_DEMAND | Fast startup | Low | Variable | Resource-constrained |

**Recommendation:** Use LOADING_MODE=ASYNC (default) for standard deployments.

---

## 4. Alternative Configuration Parameters

### A. Connection Options Deep Dive

```python
from livekit.agents import APIConnectOptions

conn_options = APIConnectOptions(
    max_retry: int = 3,              # Number of retry attempts
    retry_interval: float = 1.0,     # Seconds to wait between retries
    timeout: float = 10.0,           # Connection timeout in seconds
)

avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
    conn_options=conn_options
)
```

### B. Advanced Parameter Combinations

**Cloud Mode with Custom Image:**
```python
avatar = bithuman.AvatarSession(
    avatar_image="path/to/custom_avatar.jpg",
    model="expression",  # Dynamic responses for custom avatar
    conn_options=APIConnectOptions(max_retry=5, timeout=30.0)
)
```

**Local Mode with Optimization:**
```python
avatar = bithuman.AvatarSession(
    model_path="/path/to/model.imx",
    model="essence",  # Faster local processing
    # Note: For local mode, initialize runtime separately:
)

# When using local mode with AsyncBithuman:
runtime = await AsyncBithuman.create(
    model_path="/path/to/model.imx",
    api_secret=os.getenv("BITHUMAN_API_SECRET"),
    num_threads=-1,           # Auto-detect optimal threads
    output_buffer_size=2,     # Low latency
    input_buffer_size=0,      # Unbounded audio input
)
```

### C. Environment-Based Tuning

Create environment profiles for different scenarios:

```bash
# Low-latency profile (.env.livekit-ultra-low-latency)
OUTPUT_WIDTH=960
COMPRESS_METHOD=NONE
LOADING_MODE=ASYNC
PROCESS_IDLE_VIDEO=False

# Stable profile (.env.livekit-balanced)
OUTPUT_WIDTH=1280
COMPRESS_METHOD=JPEG
LOADING_MODE=ASYNC
PROCESS_IDLE_VIDEO=True

# Resource-constrained profile (.env.livekit-constrained)
OUTPUT_WIDTH=720
COMPRESS_METHOD=JPEG
LOADING_MODE=ON_DEMAND
PROCESS_IDLE_VIDEO=False
```

### D. Runtime Settings Modification

```python
# Access runtime settings for monitoring/tuning
runtime = await AsyncBithuman.create(...)
settings = runtime.settings

# Available settings:
# - OUTPUT_WIDTH: current video width
# - FPS: frames per second (25)
# - INPUT_SAMPLE_RATE: audio sample rate (16000)
# - COMPRESS_METHOD: current compression
# - LOADING_MODE: current loading strategy
# - PROCESS_IDLE_VIDEO: idle frame processing
# - LIVA_IDEL_VIDEO_ENABLED: idle animations
# - LIVA_AUTO_SAY_HI: auto-greeting

# Set idle timeout for resources
runtime.set_idle_timeout(0.001)  # Minimal timeout
```

---

## 5. Known Issues with Synchronization

### A. Lip-Sync Drift

**Issue:** Avatar mouth movements lag behind or run ahead of audio
**Root Causes:**
1. Buffer queue timing mismatch between audio and video
2. Audio resampling delays (24kHz input to 16kHz for BitHuman)
3. Frame processing latency variation

**Mitigation Strategies:**
1. Reduce `output_buffer_size` (lower = tighter sync, higher jitter)
2. Ensure audio chunks are properly batched to match video frame duration
3. Monitor and log audio/video timestamps
4. Use "essence" model (lower processing latency)

### B. Audio Cutoff or Stuttering

**Issue:** Speech cuts off prematurely or audio stutters
**Root Causes:**
1. Buffer overflow/underflow from insufficient queue size
2. Audio chunk timing misalignment
3. Network packet loss affecting audio delivery

**Mitigation:**
1. Increase `input_buffer_size` slightly for audio buffering
2. Implement audio batching to align with frame boundaries
3. Monitor network quality and adjust retries accordingly

### C. Frame Jitter or Dropping

**Issue:** Video playback stutters, frames drop, inconsistent framerate
**Root Causes:**
1. `output_buffer_size` too small (can't absorb processing jitter)
2. CPU overload from processing or compression
3. Network bandwidth constraints

**Mitigation:**
1. Increase `output_buffer_size` gradually (monitor added latency)
2. Reduce `OUTPUT_WIDTH` or use faster compression
3. Use thread tuning for better CPU utilization

### D. Idle State Behavior Issues

**Issue:** Avatar continues moving during silence or becomes unresponsive
**Root Causes:**
1. `PROCESS_IDLE_VIDEO=True` generates idle animations
2. `LIVA_IDEL_VIDEO_ENABLED=True` allows continuous animation
3. `LIVA_AUTO_SAY_HI=True` may trigger unwanted animations

**Mitigation:**
1. Set `PROCESS_IDLE_VIDEO=False` to disable idle frames
2. Set `LIVA_IDEL_VIDEO_ENABLED=False` if unnecessary
3. Keep `LIVA_AUTO_SAY_HI=False` unless explicitly needed

### E. Token Expiration During Streaming

**Issue:** Stream stops with "Token has expired" error
**Root Causes:**
1. Long conversation sessions exceed token lifetime
2. Token refresh failing in background
3. Model hash changes causing token invalidation

**Mitigation:**
1. Implement token refresh monitoring
2. Handle `RuntimeError("Token has expired...")` gracefully
3. Use proper shutdown callbacks to clean up resources

### F. Cloud API Rate Limiting

**Issue:** Avatar initialization fails with API errors
**Root Causes:**
1. Too many requests to BitHuman cloud API
2. Insufficient retry configuration
3. Network timeouts

**Mitigation:**
```python
conn_options = APIConnectOptions(
    max_retry=5,           # Increased from default 3
    retry_interval=2.0,    # Increased from default 1.0
    timeout=30.0,          # Increased from default 10.0
)
```

---

## 6. Optimization Recommendations for Your Implementation

### Current Implementation Analysis

Your code:
```python
avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
)
await avatar.start(session, room=ctx.room)
```

**Issues Identified:**
1. No model selection (using cloud default, possibly "expression")
2. No buffer tuning (using defaults which may cause latency)
3. No connection optimization (using default timeouts)
4. No threading configuration
5. Using cloud API instead of optimized local mode
6. No environment-based configuration

### Recommended Implementation v1 (Balanced)

```python
import os
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman

# Configuration
avatar_id = os.getenv("BITHUMAN_AVATAR_ID")
use_local_model = os.getenv("BITHUMAN_LOCAL_MODE", "false").lower() == "true"

# Balanced configuration for standard deployments
if use_local_model:
    # Local mode - better for low-latency, offline capability
    avatar = bithuman.AvatarSession(
        model_path=os.getenv("BITHUMAN_MODEL_PATH"),
        model="essence",  # Lower latency
    )
else:
    # Cloud mode - simpler deployment
    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",  # Lower latency than "expression"
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

### Recommended Implementation v2 (Ultra-Low-Latency)

```python
import os
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman

avatar_id = os.getenv("BITHUMAN_AVATAR_ID")

# Ultra-low-latency configuration for real-time conversations
avatar = bithuman.AvatarSession(
    avatar_id=avatar_id,
    model="essence",  # Fastest model with good quality
    conn_options=APIConnectOptions(
        max_retry=3,
        retry_interval=0.5,
        timeout=10.0,
    ),
)

# Set environment variables for optimal settings
os.environ.setdefault("OUTPUT_WIDTH", "960")  # Lower resolution
os.environ.setdefault("COMPRESS_METHOD", "NONE")  # Skip compression
os.environ.setdefault("LOADING_MODE", "ASYNC")
os.environ.setdefault("PROCESS_IDLE_VIDEO", "False")  # No idle frames

await avatar.start(session, room=ctx.room)
```

### Recommended Implementation v3 (Local Mode - Best Performance)

```python
import os
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman
from bithuman import AsyncBithuman

avatar_id = os.getenv("BITHUMAN_AVATAR_ID")
model_path = os.getenv("BITHUMAN_MODEL_PATH")
api_secret = os.getenv("BITHUMAN_API_SECRET")

if not model_path:
    logger.warning("BITHUMAN_MODEL_PATH not set, falling back to cloud mode")
    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",
    )
else:
    # Local mode with optimized runtime
    runtime = await AsyncBithuman.create(
        model_path=model_path,
        api_secret=api_secret,
        num_threads=-1,  # Auto-detect optimal thread count
        output_buffer_size=2,  # Low latency buffering
        input_buffer_size=0,   # Unbounded audio input
    )

    avatar = bithuman.AvatarSession(
        model_path=model_path,
        model="essence",
        runtime=runtime,
    )

await avatar.start(session, room=ctx.room)
```

### Recommended Implementation v4 (Environment-Driven)

```python
import os
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman

# Read deployment profile from environment
deployment_mode = os.getenv("DEPLOYMENT_MODE", "balanced")  # ultra-low-latency, balanced, constrained

# Configuration profiles
configs = {
    "ultra-low-latency": {
        "model": "essence",
        "max_retry": 3,
        "retry_interval": 0.5,
        "timeout": 10.0,
        "OUTPUT_WIDTH": "960",
        "COMPRESS_METHOD": "NONE",
        "PROCESS_IDLE_VIDEO": "False",
    },
    "balanced": {
        "model": "essence",
        "max_retry": 5,
        "retry_interval": 1.5,
        "timeout": 20.0,
        "OUTPUT_WIDTH": "1280",
        "COMPRESS_METHOD": "JPEG",
        "PROCESS_IDLE_VIDEO": "True",
    },
    "constrained": {
        "model": "essence",
        "max_retry": 5,
        "retry_interval": 2.0,
        "timeout": 30.0,
        "OUTPUT_WIDTH": "720",
        "COMPRESS_METHOD": "JPEG",
        "PROCESS_IDLE_VIDEO": "False",
    },
}

config = configs.get(deployment_mode, configs["balanced"])

# Set environment variables
for key, value in config.items():
    if key.isupper():
        os.environ.setdefault(key, value)

# Initialize avatar
avatar = bithuman.AvatarSession(
    avatar_id=os.getenv("BITHUMAN_AVATAR_ID"),
    model=config["model"],
    conn_options=APIConnectOptions(
        max_retry=config["max_retry"],
        retry_interval=config["retry_interval"],
        timeout=config["timeout"],
    ),
)

logger.info(f"Avatar initialized with {deployment_mode} mode")
await avatar.start(session, room=ctx.room)
```

---

## Summary Table: Configuration Impact

| Parameter | Impact | Low-Latency | Balanced | Stable |
|-----------|--------|-------------|----------|--------|
| **model** | Latency, CPU | essence | essence | essence |
| **output_buffer_size** | Latency, Jitter | 2 | 3 | 5 |
| **input_buffer_size** | Audio overflow | 0 | 2 | 5 |
| **num_threads** | CPU utilization | -1 | -1 | 0 |
| **OUTPUT_WIDTH** | Bandwidth, CPU | 960 | 1280 | 1280 |
| **COMPRESS_METHOD** | Bandwidth, CPU | NONE | JPEG | JPEG |
| **PROCESS_IDLE_VIDEO** | Idle animation | False | True | True |
| **LOADING_MODE** | Startup, Memory | ASYNC | ASYNC | ASYNC |

---

## Sources

- [BitHuman Virtual Avatar Integration Guide - LiveKit Docs](https://docs.livekit.io/agents/models/avatar/plugins/bithuman/)
- [LiveKit Plugins BitHuman API Reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/bithuman/index.html)
- [BitHuman SDK Documentation](https://docs.bithuman.ai/)
- [BitHuman SDK Quick Start](https://docs.bithuman.io/api-reference/sdk/quick-start)
- [BitHuman GitHub Examples](https://github.com/bithuman-ai/sdk-examples-python)
- [BitHuman Virtual Avatar SDK Overview](https://www.bithuman.ai/sdk)
