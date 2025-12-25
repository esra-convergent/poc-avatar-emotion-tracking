# LiveKit Avatar Integration - Setup Guide

## 🎯 What You're Getting

A **real, photorealistic human avatar** that:
- ✅ Lip-syncs perfectly to your agent's speech
- ✅ Shows facial expressions
- ✅ Streams in real-time to your frontend
- ✅ Works natively with LiveKit (no custom code needed!)

---

## 🚀 Quick Start

### Step 1: Install Avatar Plugin

```bash
cd python-agent
uv add "livekit-agents[bithuman]~=1.3"
```

### Step 2: Get BitHuman API Key

1. Go to: https://imaginex.bithuman.com/
2. Sign up for free account
3. Create a new avatar or use a premade one
4. Copy your **API Secret** and **Avatar ID**

### Step 3: Configure Environment Variables

Create/update `python-agent/.env.local`:

```bash
# BitHuman Configuration
BITHUMAN_API_SECRET=your-api-secret-here
BITHUMAN_AVATAR_ID=your-avatar-id-here
ENABLE_AVATAR=true
```

### Step 4: Use the Updated Agent

**Option A**: Replace your current agent file
```bash
cd python-agent/src
mv agent.py agent_backup.py
mv agent_with_avatar.py agent.py
```

**Option B**: Run the new agent directly
```bash
cd python-agent
python src/agent_with_avatar.py dev
```

### Step 5: Run Frontend

```bash
pnpm run dev
```

### Step 6: Test It!

1. Open http://localhost:3000
2. Click "Start call"
3. **You should see a real human avatar appear!**
4. Speak to the agent - watch the avatar's lips move in sync

---

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────┐
│         Python Agent (agent_with_avatar.py) │
│                                             │
│  ┌─────────────┐      ┌────────────────┐   │
│  │ AgentSession│      │ AvatarSession  │   │
│  │  (STT/LLM/  │──────│   (BitHuman)   │   │
│  │   TTS)      │      └────────────────┘   │
│  └─────────────┘              │            │
└────────────────────────────────┼────────────┘
                                 │
                      Joins LiveKit Room
                                 │
                                 ▼
┌─────────────────────────────────────────────┐
│           LiveKit Room                      │
│                                             │
│  📹 Avatar Video Track (from BitHuman)      │
│  🔊 Avatar Audio Track (synced to speech)   │
└─────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────┐
│         React Frontend (Existing!)          │
│                                             │
│  useVoiceAssistant() → agentVideoTrack      │
│  VideoTrack component displays avatar       │
│                                             │
│  NO CODE CHANGES NEEDED! ✅                 │
└─────────────────────────────────────────────┘
```

### What Happens

1. **Agent starts** → Creates `AvatarSession`
2. **Avatar joins room** → As a separate participant
3. **Agent speaks** → Avatar lip-syncs automatically
4. **Frontend displays** → Shows video track (already built!)

---

## 📝 Configuration Options

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BITHUMAN_API_SECRET` | ✅ Yes | API key from BitHuman | `sk_live_abc123...` |
| `BITHUMAN_AVATAR_ID` | ✅ Yes | Avatar identifier | `avatar_xyz789` |
| `ENABLE_AVATAR` | Optional | Enable/disable avatar | `true` or `false` (default: `false`) |

### Code Configuration

In `agent_with_avatar.py`:

```python
# Use avatar ID (from BitHuman console)
avatar = bithuman.AvatarSession(
    avatar_id="your-avatar-id"
)

# OR use local .imx model file
avatar = bithuman.AvatarSession(
    model_path="/path/to/avatar.imx"
)

# OR use PIL image
from PIL import Image
avatar = bithuman.AvatarSession(
    image=Image.open("photo.jpg")
)
```

---

## 🎭 Creating Your Avatar

### Option 1: BitHuman Console (Recommended)

1. Go to https://imaginex.bithuman.com/
2. Upload a photo or use their defaults
3. Customize appearance
4. Download `.imx` file OR use Avatar ID

### Option 2: Use Image Directly

```python
# In agent_with_avatar.py, replace avatar creation:
from PIL import Image

avatar = bithuman.AvatarSession(
    image="/path/to/your/photo.jpg",  # Or Image.open(...)
    # Optional: model type
    model_type="expression",  # or "essence"
)
```

### Model Types

- **`expression`**: Dynamic facial expressions (better for emotions)
- **`essence`**: Predefined actions (faster, less CPU)

---

## 🆓 Free vs Paid

### BitHuman Pricing

- **Free Tier**: Available for testing
- **API Costs**: Check https://imaginex.bithuman.com/pricing
- **Local Models**: Download `.imx` files and run on your server (may be free after download)

### Other Providers (if BitHuman doesn't work)

Change one line in code:

```python
# Tavus (professional quality)
from livekit.plugins import tavus
avatar = tavus.AvatarSession(replica_id="...")

# Hedra (good quality)
from livekit.plugins import hedra
avatar = hedra.AvatarSession(avatar_id="...")

# Simli (fast)
from livekit.plugins import simli
avatar = simli.AvatarSession(avatar_id="...")
```

Each has their own signup/pricing.

---

## 🧪 Testing

### 1. Check if Plugin is Installed

```bash
cd python-agent
python -c "from livekit.plugins import bithuman; print('✅ Plugin installed')"
```

### 2. Verify Environment Variables

```bash
cd python-agent
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env.local'); print('API Secret:', 'SET' if os.getenv('BITHUMAN_API_SECRET') else 'NOT SET'); print('Avatar ID:', 'SET' if os.getenv('BITHUMAN_AVATAR_ID') else 'NOT SET')"
```

### 3. Run Agent in Debug Mode

```bash
cd python-agent
python src/agent_with_avatar.py dev
```

Look for these log messages:
```
🎭 Avatar mode ENABLED - setting up BitHuman avatar...
🎭 Starting avatar: avatar_xyz789
✅ Avatar started successfully!
```

### 4. Check Frontend

1. Open http://localhost:3000
2. Start call
3. **Check browser DevTools → Network tab**
   - Should see WebRTC video stream
4. **Check LiveKit room**
   - Should see 2 participants: you + avatar worker

---

## 🐛 Troubleshooting

### Avatar Not Appearing

**Symptoms**: No video, only audio visualizer

**Fixes**:
1. Check `ENABLE_AVATAR=true` in `.env.local`
2. Verify API key is correct
3. Check Python logs for errors
4. Ensure BitHuman plugin is installed: `uv add "livekit-agents[bithuman]~=1.3"`

**Debug**:
```bash
cd python-agent
python src/agent_with_avatar.py dev
# Look for "Avatar started successfully" message
```

### Plugin Import Error

**Error**: `ModuleNotFoundError: No module named 'livekit.plugins.bithuman'`

**Fix**:
```bash
cd python-agent
uv add "livekit-agents[bithuman]~=1.3"
```

### Avatar Joins But No Video

**Symptoms**: Avatar participant joins room, but no video track

**Fixes**:
1. Check BitHuman API quota/limits
2. Verify Avatar ID is correct
3. Try using a different avatar or model file
4. Check if your account needs activation

### Poor Quality or Lag

**Symptoms**: Blurry avatar, choppy movement

**Fixes**:
1. **Server Resources**: BitHuman rendering uses CPU/GPU
   - Use cloud-hosted models (set in BitHuman console)
   - Upgrade server if running locally
2. **Network**: Check bandwidth
3. **Try Different Provider**: Hedra or Tavus may have better performance

### API Key Issues

**Error**: `401 Unauthorized` or `403 Forbidden`

**Fix**:
1. Regenerate API key in BitHuman console
2. Make sure it's in `.env.local` NOT `.env`
3. Restart Python agent after changing `.env.local`

---

## 🔄 Switching Back to Voice-Only

### Temporarily Disable Avatar

Set in `.env.local`:
```bash
ENABLE_AVATAR=false
```

### Permanently Remove Avatar

Use your original `agent.py`:
```bash
cd python-agent/src
mv agent.py agent_with_avatar_backup.py
mv agent_backup.py agent.py
```

---

## 📊 Performance Considerations

### Resource Usage

- **BitHuman (cloud)**: Minimal local resources, uses BitHuman servers
- **BitHuman (local .imx)**: High CPU usage, may need GPU
- **Network**: Additional ~1-2 Mbps for video stream

### Latency

- **Lip-sync**: Near-instant (< 100ms)
- **Avatar loading**: 2-5 seconds on first join
- **Emotion changes**: Handled by BitHuman (varies by model)

### Scaling

- Each avatar session = one BitHuman worker
- Check BitHuman pricing for concurrent limits
- Consider using cloud models for production

---

## ✅ Success Checklist

Before going live, verify:

- [ ] BitHuman plugin installed (`uv add ...`)
- [ ] API key set in `.env.local`
- [ ] Avatar ID configured
- [ ] `ENABLE_AVATAR=true`
- [ ] Agent starts without errors
- [ ] Avatar appears in frontend
- [ ] Lip-sync works when agent speaks
- [ ] No console errors in browser

---

## 🎯 Next Steps

1. **Install the plugin**: `cd python-agent && uv add "livekit-agents[bithuman]~=1.3"`
2. **Get API credentials**: https://imaginex.bithuman.com/
3. **Configure `.env.local`**
4. **Run agent**: `python src/agent_with_avatar.py dev`
5. **Test in browser**: http://localhost:3000

---

## 🆘 Need Help?

- **BitHuman Docs**: https://docs.imaginex.ai/
- **LiveKit Avatar Docs**: https://docs.livekit.io/agents/models/avatar/
- **LiveKit Discord**: https://livekit.io/discord

---

**That's it! Your avatar should now be talking, lip-syncing, and looking realistic!** 🎉
