# MeetingMind Enterprise

<div align="center">

![Version](https://img.shields.io/badge/version-5.0.0-6366f1?style=for-the-badge)
![Enterprise](https://img.shields.io/badge/grade-Enterprise-10b981?style=for-the-badge)

**Enterprise-grade AI meeting intelligence**

*Capture what matters, not everything.*

</div>

---

## ✨ Features

### 📊 Dashboard & Analytics
- **Meeting Statistics** — Total meetings, time spent, action items, attendees
- **Activity Charts** — Visual meeting activity over time
- **Filterable Reports** — Filter by date range, meeting type
- **Quick Actions** — Start meeting, search, generate reports

### 🎙️ Smart Recording
- **Real-time Transcription** — Live speech-to-text capture
- **Speaker Tracking** — Assign dialogue to participants
- **Highlight Moments** — Mark important points instantly
- **Action Item Markers** — Tag tasks as they come up

### 🤖 AI Intelligence
- **Chat Assistant** — Ask questions about your meeting
- **Smart Minutes** — Auto-generated summaries with decisions & action items
- **Template-Based Output** — Optimized for different meeting types

### 📤 Export Options
- **Save as PDF** — Download meeting minutes
- **Email Minutes** — Send directly via email
- **Print** — Print meeting minutes
- **Copy to Clipboard** — Quick copy for pasting

## 🚀 Quick Start

### Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variables (see below)
4. Deploy!

### Environment Variables

Add these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key |

### Run Locally

```bash
# Clone the repo
git clone <your-repo>
cd meetingmind-enterprise

# Install dependencies
npm install

# Create .env file with your variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

## 📋 Supabase Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create the required tables.

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Safari | ✅ Full |
| Firefox | ⚠️ Limited speech recognition |

## 🔒 Privacy

- Audio processed locally in browser
- Data stored in your Supabase instance
- AI features use on-demand API calls only

## 📄 License

MIT License

---

<div align="center">

**Built for teams who value their meeting time**

</div>
