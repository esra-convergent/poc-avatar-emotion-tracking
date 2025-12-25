"""
BitHuman Avatar Configuration Examples
Practical code examples for optimizing BitHuman avatar initialization
"""

import os
from livekit.agents import APIConnectOptions
from livekit.plugins import bithuman
from bithuman import AsyncBithuman
import logging

logger = logging.getLogger("avatar")


# ============================================================================
# EXAMPLE 1: Ultra-Low-Latency Configuration
# ============================================================================
async def setup_avatar_ultra_low_latency(avatar_id: str):
    """
    Configuration optimized for real-time conversations with minimal latency.
    Trade-off: Less robust to jitter, requires stable network.

    Use cases:
    - Interactive real-time conversations
    - Demos and presentations
    - High-quality interactive sessions
    """
    logger.info("Initializing avatar in ultra-low-latency mode")

    # Use "essence" model for faster processing
    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",  # Lower latency, good quality
        conn_options=APIConnectOptions(
            max_retry=3,           # Fewer retries = faster fail/fallback
            retry_interval=0.5,    # Short wait between retries
            timeout=10.0,          # Short timeout
        ),
    )

    # Set environment for low-latency
    os.environ.setdefault("OUTPUT_WIDTH", "960")      # Lower resolution
    os.environ.setdefault("COMPRESS_METHOD", "NONE")  # Skip compression
    os.environ.setdefault("PROCESS_IDLE_VIDEO", "False")

    return avatar


# ============================================================================
# EXAMPLE 2: Balanced Configuration (Recommended)
# ============================================================================
async def setup_avatar_balanced(avatar_id: str):
    """
    Configuration balanced between latency, quality, and robustness.
    Best for most production deployments.

    Use cases:
    - Standard voice agent deployments
    - Production systems
    - Acceptable latency + good robustness
    """
    logger.info("Initializing avatar in balanced mode")

    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",  # Good balance of quality and speed
        conn_options=APIConnectOptions(
            max_retry=5,           # Reasonable retry count
            retry_interval=1.5,    # Standard retry interval
            timeout=20.0,          # Reasonable timeout
        ),
    )

    # Set environment for balanced performance
    os.environ.setdefault("OUTPUT_WIDTH", "1280")     # Standard resolution
    os.environ.setdefault("COMPRESS_METHOD", "JPEG")  # Compress for bandwidth
    os.environ.setdefault("PROCESS_IDLE_VIDEO", "True")

    return avatar


# ============================================================================
# EXAMPLE 3: High-Quality/Expressive Configuration
# ============================================================================
async def setup_avatar_high_quality(avatar_id: str):
    """
    Configuration optimized for visual quality and emotional expressiveness.
    Trade-off: Higher latency, higher CPU usage.

    Use cases:
    - Interviews or important presentations
    - Emotional response scenarios
    - When quality matters more than latency
    """
    logger.info("Initializing avatar in high-quality mode")

    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="expression",  # More expressive but higher latency
        conn_options=APIConnectOptions(
            max_retry=5,
            retry_interval=2.0,
            timeout=30.0,
        ),
    )

    # Set environment for quality
    os.environ.setdefault("OUTPUT_WIDTH", "1280")     # Full resolution
    os.environ.setdefault("COMPRESS_METHOD", "NONE")  # No compression
    os.environ.setdefault("PROCESS_IDLE_VIDEO", "True")
    os.environ.setdefault("LIVA_IDEL_VIDEO_ENABLED", "True")

    return avatar


# ============================================================================
# EXAMPLE 4: Resource-Constrained Configuration
# ============================================================================
async def setup_avatar_constrained(avatar_id: str):
    """
    Configuration for resource-constrained environments.
    Optimizes for low bandwidth, low CPU, lower quality.

    Use cases:
    - Edge devices with limited resources
    - Mobile deployments
    - High-latency networks
    """
    logger.info("Initializing avatar in resource-constrained mode")

    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",  # Lower resource usage
        conn_options=APIConnectOptions(
            max_retry=5,           # More retries for unreliable networks
            retry_interval=2.0,
            timeout=30.0,          # Longer timeouts for slow networks
        ),
    )

    # Set environment for low resource usage
    os.environ.setdefault("OUTPUT_WIDTH", "720")      # Lower resolution
    os.environ.setdefault("COMPRESS_METHOD", "JPEG")  # Heavy compression
    os.environ.setdefault("PROCESS_IDLE_VIDEO", "False")
    os.environ.setdefault("LIVA_IDEL_VIDEO_ENABLED", "False")

    return avatar


# ============================================================================
# EXAMPLE 5: Local Model Mode (Best Performance)
# ============================================================================
async def setup_avatar_local_mode(model_path: str, api_secret: str):
    """
    Configuration using local BitHuman model for maximum control and performance.
    Requires model file (.imx) and API secret for token generation.

    Advantages:
    - No cloud API dependency
    - Full control over threading and buffering
    - Optimal performance for specific hardware

    Requirements:
    - BITHUMAN_MODEL_PATH environment variable or model_path parameter
    - BITHUMAN_API_SECRET for token generation
    """
    logger.info("Initializing avatar in local mode")

    # Create optimized runtime
    runtime = await AsyncBithuman.create(
        model_path=model_path,
        api_secret=api_secret,

        # Threading configuration
        num_threads=-1,  # Auto-detect optimal threads based on CPU cores

        # Buffer configuration for low-latency
        output_buffer_size=2,   # ~80ms buffering at 25 FPS
        input_buffer_size=0,    # Unbounded audio input (don't drop audio)
    )

    # Create avatar session with the custom runtime
    avatar = bithuman.AvatarSession(
        model_path=model_path,
        model="essence",
        runtime=runtime,  # Use custom runtime
    )

    return avatar


# ============================================================================
# EXAMPLE 6: Custom Avatar Image with Expression Model
# ============================================================================
async def setup_avatar_custom_image(avatar_image_path: str, api_secret: str):
    """
    Configuration using a custom avatar image with dynamic expressions.
    Creates a personalized avatar from a user-provided image.

    Requirements:
    - Path to image file (JPG, PNG, etc.)
    - BITHUMAN_API_SECRET for cloud processing
    """
    logger.info(f"Initializing avatar with custom image: {avatar_image_path}")

    avatar = bithuman.AvatarSession(
        avatar_image=avatar_image_path,  # Can be file path, HTTP URL, or PIL Image
        model="expression",  # Dynamic expressions for custom avatars
        api_secret=api_secret,
        conn_options=APIConnectOptions(
            max_retry=5,
            retry_interval=1.5,
            timeout=20.0,
        ),
    )

    return avatar


# ============================================================================
# EXAMPLE 7: Deployment Profile Selection
# ============================================================================
async def setup_avatar_with_profile(profile: str = "balanced"):
    """
    Select avatar configuration based on deployment profile.
    Allows runtime selection of optimization strategy.

    Profiles:
    - "ultra-low-latency": Minimum delay, high jitter risk
    - "balanced": Good balance (RECOMMENDED)
    - "high-quality": Maximum quality, higher latency
    - "constrained": Minimum resources
    - "local": Local model mode (requires model file)
    """
    avatar_id = os.getenv("BITHUMAN_AVATAR_ID")

    if profile == "ultra-low-latency":
        return await setup_avatar_ultra_low_latency(avatar_id)
    elif profile == "balanced":
        return await setup_avatar_balanced(avatar_id)
    elif profile == "high-quality":
        return await setup_avatar_high_quality(avatar_id)
    elif profile == "constrained":
        return await setup_avatar_constrained(avatar_id)
    elif profile == "local":
        model_path = os.getenv("BITHUMAN_MODEL_PATH")
        api_secret = os.getenv("BITHUMAN_API_SECRET")
        return await setup_avatar_local_mode(model_path, api_secret)
    else:
        raise ValueError(f"Unknown profile: {profile}")


# ============================================================================
# EXAMPLE 8: Advanced Configuration with Monitoring
# ============================================================================
async def setup_avatar_with_monitoring(avatar_id: str):
    """
    Configuration that enables monitoring and diagnostics.
    Tracks performance metrics and avatar status.
    """
    logger.info("Initializing avatar with monitoring enabled")

    avatar = bithuman.AvatarSession(
        avatar_id=avatar_id,
        model="essence",
        conn_options=APIConnectOptions(
            max_retry=5,
            retry_interval=1.5,
            timeout=20.0,
        ),
        # Custom participant identity for tracking
        avatar_participant_identity="avatar-monitored",
        avatar_participant_name="Monitored Avatar",
    )

    return avatar


# ============================================================================
# EXAMPLE 9: Graceful Fallback Configuration
# ============================================================================
async def setup_avatar_with_fallback(avatar_id: str, model_path: str = None):
    """
    Configuration that gracefully falls back from local to cloud mode.
    Best for production deployments where availability is critical.
    """
    logger.info("Initializing avatar with fallback logic")

    # Try local mode first if model path is available
    if model_path and os.path.exists(model_path):
        try:
            logger.info("Attempting to use local model")
            api_secret = os.getenv("BITHUMAN_API_SECRET")
            if api_secret:
                return await setup_avatar_local_mode(model_path, api_secret)
            else:
                logger.warning("No API secret for local mode, falling back to cloud")
        except Exception as e:
            logger.warning(f"Local mode failed: {e}, falling back to cloud")

    # Fall back to cloud mode
    logger.info("Using cloud mode")
    return await setup_avatar_balanced(avatar_id)


# ============================================================================
# EXAMPLE 10: Dynamic Configuration Based on System Resources
# ============================================================================
async def setup_avatar_adaptive():
    """
    Configuration that adapts based on available system resources.
    Automatically selects optimal settings based on hardware.
    """
    import psutil

    logger.info("Initializing avatar with adaptive configuration")

    # Analyze system resources
    cpu_count = psutil.cpu_count()
    available_memory = psutil.virtual_memory().available / (1024 * 1024 * 1024)  # GB

    logger.info(f"System: {cpu_count} CPUs, {available_memory:.1f}GB RAM")

    # Select profile based on resources
    if cpu_count >= 8 and available_memory >= 8:
        profile = "high-quality"
        num_threads = -1  # Auto-detect
    elif cpu_count >= 4 and available_memory >= 4:
        profile = "balanced"
        num_threads = -1
    else:
        profile = "constrained"
        num_threads = 0  # Single-threaded

    logger.info(f"Selected profile: {profile}")

    avatar_id = os.getenv("BITHUMAN_AVATAR_ID")
    return await setup_avatar_with_profile(profile)


# ============================================================================
# EXAMPLE 11: Environment Variable Configuration
# ============================================================================
def setup_environment_from_profile(profile: str):
    """
    Set environment variables based on deployment profile.
    Call this before avatar initialization.
    """
    profiles = {
        "ultra-low-latency": {
            "OUTPUT_WIDTH": "960",
            "COMPRESS_METHOD": "NONE",
            "LOADING_MODE": "ASYNC",
            "PROCESS_IDLE_VIDEO": "False",
        },
        "balanced": {
            "OUTPUT_WIDTH": "1280",
            "COMPRESS_METHOD": "JPEG",
            "LOADING_MODE": "ASYNC",
            "PROCESS_IDLE_VIDEO": "True",
        },
        "high-quality": {
            "OUTPUT_WIDTH": "1280",
            "COMPRESS_METHOD": "NONE",
            "LOADING_MODE": "SYNC",
            "PROCESS_IDLE_VIDEO": "True",
            "LIVA_IDEL_VIDEO_ENABLED": "True",
        },
        "constrained": {
            "OUTPUT_WIDTH": "720",
            "COMPRESS_METHOD": "JPEG",
            "LOADING_MODE": "ON_DEMAND",
            "PROCESS_IDLE_VIDEO": "False",
        },
    }

    config = profiles.get(profile, profiles["balanced"])
    for key, value in config.items():
        os.environ[key] = value
        logger.debug(f"Set {key}={value}")


# ============================================================================
# EXAMPLE 12: Complete Integration Example
# ============================================================================
async def my_agent_with_optimized_avatar(ctx):
    """
    Complete integration example showing how to use optimized avatar
    in the context of the agent lifecycle.
    """
    from livekit.agents import AgentSession

    # Get deployment mode from environment or default to balanced
    profile = os.getenv("AVATAR_PROFILE", "balanced")
    logger.info(f"Starting agent with avatar profile: {profile}")

    # Setup environment
    setup_environment_from_profile(profile)

    # Initialize avatar based on profile
    try:
        avatar = await setup_avatar_with_profile(profile)
        logger.info(f"Avatar initialized with {profile} profile")
    except Exception as e:
        logger.error(f"Failed to initialize avatar: {e}")
        logger.info("Falling back to voice-only mode")
        avatar = None

    # Create agent session
    session = AgentSession(
        # ... session configuration ...
    )

    # Start avatar if initialized
    if avatar:
        try:
            await avatar.start(session, room=ctx.room)
            logger.info("Avatar started successfully")
        except Exception as e:
            logger.error(f"Failed to start avatar: {e}")
            logger.info("Continuing with voice-only mode")

    # Continue with normal agent flow
    await session.start(
        # ... agent configuration ...
    )


# ============================================================================
# Buffer Size Reference Table
# ============================================================================
"""
Buffer Configuration Reference (at 25 FPS):

output_buffer_size = 2:
    - Buffering: ~80ms
    - Latency impact: Minimal
    - Jitter tolerance: Low
    - Use case: Ultra-low-latency conversations

output_buffer_size = 3:
    - Buffering: ~120ms
    - Latency impact: Low
    - Jitter tolerance: Medium
    - Use case: Balanced, recommended

output_buffer_size = 5:
    - Buffering: ~200ms
    - Latency impact: Noticeable
    - Jitter tolerance: High
    - Use case: Stable networks, high robustness

input_buffer_size = 0:
    - Audio input queue: Unbounded
    - Backpressure: None
    - Memory: Unbounded (risk if slow processing)
    - Use case: Ensure no audio loss

input_buffer_size = 2:
    - Audio input queue: 2 chunks
    - Backpressure: Applied after 2 chunks
    - Memory: Bounded
    - Use case: Standard deployments

input_buffer_size = 5:
    - Audio input queue: 5 chunks
    - Backpressure: Applied after 5 chunks
    - Memory: More bounded
    - Use case: Bursty audio patterns
"""


# ============================================================================
# Troubleshooting Guide
# ============================================================================
"""
SYMPTOM: Avatar mouth lags behind audio (lip-sync drift)
CAUSE: Buffer queue timing mismatch
FIX:
    1. Reduce output_buffer_size from 5 -> 3 -> 2
    2. Ensure audio chunks align with video frames (40ms = 640 samples)
    3. Use "essence" model instead of "expression"

SYMPTOM: Audio cuts off prematurely
CAUSE: Input buffer overflow or underflow
FIX:
    1. Set input_buffer_size=0 (unbounded)
    2. Monitor network quality
    3. Increase retry_interval to allow slower processing

SYMPTOM: Jerky video, stuttering
CAUSE: Output buffer too small or CPU bottleneck
FIX:
    1. Increase output_buffer_size from 2 -> 3 -> 5
    2. Reduce OUTPUT_WIDTH from 1280 -> 960 -> 720
    3. Set num_threads=-1 for multi-threaded processing

SYMPTOM: Avatar too stiff, no emotions
CAUSE: Using "essence" model
FIX:
    1. Switch to model="expression"
    2. Accept higher latency tradeoff
    3. Monitor CPU usage to ensure it's available

SYMPTOM: "Token has expired" error during stream
CAUSE: Long session exceeding token lifetime
FIX:
    1. Implement token refresh monitoring
    2. Use local mode if available
    3. Check BITHUMAN_API_SECRET is correct
"""
