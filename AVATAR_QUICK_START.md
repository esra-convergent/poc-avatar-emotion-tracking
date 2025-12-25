# LiveKit Avatar - Quick Start (5 Minutes)

## 🎯 What You Need

1. BitHuman API credentials (free signup)
2. 5 minutes of your time

---

## 📋 Step-by-Step

### 1. Install Plugin (30 seconds)

```bash
cd python-agent
uv add "livekit-agents[bithuman]~=1.3"
```

### 2. Get BitHuman Credentials (2 minutes)

1. Visit: https://imaginex.bithuman.com/
2. Sign up (free)
3. Create or select an avatar
4. Copy:
   - **API Secret** (from Settings/API Keys)
   - **Avatar ID** (from avatar details)

### 3. Configure Environment (30 seconds)

Edit `python-agent/.env.local`:

```bash
BITHUMAN_API_SECRET=your-api-secret-here
BITHUMAN_AVATAR_ID=your-avatar-id-here
ENABLE_AVATAR=true
```

### 4. Use Avatar-Enabled Agent (30 seconds)

```bash
cd python-agent
python src/agent_with_avatar.py dev
```

### 5. Run Frontend (30 seconds)

```bash
# In another terminal
pnpm run dev
```

### 6. Test! (1 minute)

1. Open: http://localhost:3000
2. Click "Start call"
3. **See real human avatar!** 🎉
4. Speak - watch avatar lip-sync

---

## ✅ Expected Result

You should see:
- Real human avatar (not cartoon)
- Mouth moving when agent speaks
- Perfect quality video
- Smooth performance

---

## 🐛 If It Doesn't Work

### Check 1: Plugin Installed?

```bash
python -c "from livekit.plugins import bithuman; print('✅ Works')"
```

### Check 2: Environment Variables Set?

```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env.local'); print('API:', os.getenv('BITHUMAN_API_SECRET')[:10] if os.getenv('BITHUMAN_API_SECRET') else 'NOT SET')"
```

### Check 3: Avatar Enabled?

Look for this in Python logs:
```
🎭 Avatar mode ENABLED
✅ Avatar started successfully!
```

---

## 📚 Full Documentation

See [LIVEKIT_AVATAR_SETUP.md](LIVEKIT_AVATAR_SETUP.md) for complete guide.

---

That's it! You now have a photorealistic avatar! 🚀
