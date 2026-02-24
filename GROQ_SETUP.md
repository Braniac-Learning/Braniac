# Groq API Integration Setup

## What is Groq?
Groq provides fast AI inference with generous free tier limits:
- **Free Tier**: 30 requests/minute, 14,400/day
- **Models**: Llama 3.3 70B, Mixtral, and more
- **Speed**: 10x faster than typical cloud APIs

## Setup Instructions

### 1. Get Your Groq API Key
1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_...`)

### 2. Add to Environment Variables

**On Render:**
1. Go to your Render dashboard
2. Select your service (braniac-backend)
3. Go to Environment tab
4. Add new environment variable:
   - Key: `GROQ_API_KEY`
   - Value: `your_groq_api_key_here`
5. Save and redeploy

**Local Development:**
Add to your `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

### 3. How It Works

The app now automatically uses Groq if the API key is available:
- ✅ **Groq API key set**: Uses Groq (fast, generous limits)
- ⚠️ **No Groq key**: Falls back to Gemini
- 🔄 **Groq fails**: Automatically falls back to Gemini

### 4. Benefits

**Groq Advantages:**
- 30 requests/minute (vs Gemini's 2/minute free tier)
- 14,400 requests/day (vs Gemini's 20/day per model)
- Faster response times
- Better for development and testing

**Current Setup:**
- Primary: Groq API (Llama 3.3 70B model)
- Fallback: Gemini API (gemini-2.5-pro model)
- Mock data: If both APIs fail

### 5. Monitoring Usage

Check your Groq usage at: https://console.groq.com/usage

### 6. Models Available

Current model: `llama-3.3-70b-versatile`
- Best balance of speed and quality
- Perfect for quiz generation

Other options:
- `llama-3.1-70b-versatile` - Previous version
- `mixtral-8x7b-32768` - Good for longer contexts
- `gemma2-9b-it` - Faster, good for simple tasks

To change model, edit `GROQ_MODEL` in server.js.
