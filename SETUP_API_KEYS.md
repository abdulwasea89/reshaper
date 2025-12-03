# 🚀 Quick Setup Guide - API Keys

## What You Need Right Now

Based on what you have, here's your setup priority:

### ✅ **Step 1: Copy .env.example to .env**

```bash
cp .env.example .env
```

### ✅ **Step 2: Add Your Existing Keys**

Open `.env` and add:

```env
# You already have these:
YOUTUBE_API_KEY=your_actual_youtube_api_key
LINKEDIN_CLIENT_ID=your_actual_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_actual_linkedin_primary_secret

# Required (you should already have):
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
DATABASE_URL=your_postgres_url
BETTER_AUTH_SECRET=your_auth_secret
```

### ⏳ **Step 3: What You'll Need Later (Optional for Phase 1)**

For Phase 1 (MVP), the system will work with **mock data** for similar posts analysis. You can add these later:

```env
# Twitter/X API (for real Twitter analysis - Phase 3)
TWITTER_BEARER_TOKEN=get_from_twitter_developer_portal

# Instagram API (for real Instagram analysis - Phase 3)  
INSTAGRAM_ACCESS_TOKEN=get_from_meta_for_developers

# For now, use mock data:
USE_MOCK_SIMILAR_POSTS=true
```

---

## 📋 Current Setup Status

| Service | Status | Phase |
|---------|--------|-------|
| ✅ Google Gemini | You have | Phase 1 (Required) |
| ✅ YouTube Data API | You have | Phase 2 (Enhanced) |
| ✅ LinkedIn OAuth | You have | Phase 3 (Real Analysis) |
| ⏳ Twitter/X API | Need later | Phase 3 (Real Analysis) |
| ⏳ Instagram API | Need later | Phase 3 (Real Analysis) |

---

## 🎯 What Works Right Now

With your current keys, you can:

1. ✅ **Scrape web pages** (Cheerio - no key needed)
2. ✅ **Scrape YouTube videos** (using your YouTube API key)
3. ✅ **Generate AI posts** (using your Gemini API key)
4. ✅ **Score virality** (algorithm-based - no key needed)
5. ✅ **Optimize content** (using Gemini)
6. ✅ **Format for platforms** (rule-based - no key needed)
7. ⏳ **Analyze similar posts** (using **mock data** for now)

---

## 🔑 How to Get Missing Keys (When Ready)

### Twitter/X API (Free Tier)

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app
3. Go to "Keys and tokens"
4. Generate Bearer Token
5. Copy to `.env` as `TWITTER_BEARER_TOKEN`

### Instagram Graph API (Free)

1. Go to https://developers.facebook.com/apps/
2. Create new app → "Business" type
3. Add "Instagram Graph API" product
4. Go to Tools → Graph API Explorer
5. Generate User Access Token
6. Copy to `.env` as `INSTAGRAM_ACCESS_TOKEN`

**Note**: Instagram requires business account and linked Facebook page

---

## ⚙️ LinkedIn OAuth Setup (You Already Have Credentials)

Since you have LinkedIn Client ID and Secret, you need to:

1. Add redirect URI in LinkedIn Developer Portal:
   - Go to https://www.linkedin.com/developers/apps
   - Add redirect URI: `http://localhost:3000/api/auth/linkedin/callback`

2. Update your `.env`:
   ```env
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
   ```

3. Required OAuth scopes:
   - `r_liteprofile` - Read profile data
   - `w_member_social` - Post on behalf of user
   - `r_organization_social` - Read organization posts

---

## 🧪 Testing Your Setup

After adding keys to `.env`, test with:

```bash
# Test Gemini API
node -e "console.log(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅ Gemini API key found' : '❌ Missing')"

# Test YouTube API
node -e "console.log(process.env.YOUTUBE_API_KEY ? '✅ YouTube API key found' : '❌ Missing')"

# Test LinkedIn credentials
node -e "console.log(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? '✅ LinkedIn credentials found' : '❌ Missing')"

# Run the app
npm run dev
```

---

## 🎬 What Happens in Phase 1 (MVP)

**With your current keys:**
1. User pastes URL → ✅ Scrapes (YouTube or web)
2. AI analyzes content → ✅ Uses Gemini
3. Fetches similar posts → ✅ Uses **mock data** (realistic examples)
4. Generates posts → ✅ Uses Gemini + mock insights
5. Scores posts → ✅ Algorithm (no API needed)
6. Optimizes → ✅ Uses Gemini
7. Formats → ✅ Rule-based (no API needed)
8. Shows in UI → ✅ Full Chain of Thought visualization

**What uses mock data:**
- Similar posts analysis (returns realistic example posts)
- Platform trends (returns example trending topics)

**Everything else is real!**

---

## 🚀 When to Add Real Platform APIs

**Phase 3** (after Phase 1 & 2 working):
- When you want **real** LinkedIn trending posts (not mock examples)
- When you want **real** Twitter engagement data
- When you want **real** Instagram post insights

**Until then**: The system generates excellent posts using your Gemini API + smart algorithms + mock insights.

---

## 💡 Pro Tip

Start with what you have! The multi-agent system will:
- ✅ Generate great posts using AI
- ✅ Score them intelligently
- ✅ Optimize automatically
- ✅ Show full Chain of Thought UI

Mock data for "similar posts" is actually **beneficial** for testing because:
- No rate limits
- Faster responses
- Predictable results
- Can test edge cases

Switch to real APIs when you need live trending data.

---

## ❓ Need Help Getting Keys?

Let me know which platform API you want to set up and I'll provide detailed step-by-step instructions!
