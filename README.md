# MeetingMind Enterprise

<div align="center">

![Version](https://img.shields.io/badge/version-5.1.0-6366f1?style=for-the-badge)
![Enterprise](https://img.shields.io/badge/grade-Enterprise-10b981?style=for-the-badge)

**Enterprise-grade AI meeting intelligence**

*Capture what matters, not everything.*

</div>

---

## ðŸš€ Quick Start

### 1. Update Supabase Schema

**IMPORTANT:** Run `supabase-schema.sql` in your Supabase SQL Editor to add the proper RLS policies.

This adds:
- Proper INSERT policies for all tables
- Profile creation trigger for new users
- Organization membership tracking
- Performance indexes

### 2. Deploy to Vercel

Push to GitHub and Vercel will auto-deploy. Make sure you have these environment variables set in Vercel:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key (optional) |

### 3. Create a User

Go to Supabase Dashboard â†’ Authentication â†’ Users â†’ Add User â†’ Create New User

---

## âœ¨ Features

### ðŸ“Š Dashboard & Analytics
- Meeting statistics, time tracking, action items
- Visual activity charts
- Filterable reports

### ðŸŽ™ï¸ Smart Recording
- Real-time transcription
- Speaker tracking with keyboard shortcuts
- Highlight moments and action items

### ðŸ¤– AI Intelligence
- Chat assistant for meeting questions
- Auto-generated minutes with decisions & action items
- Template-based output

### ðŸ“¤ Export Options
- PDF, Email, Print, Clipboard

---

## ðŸ“‹ File Structure

```
meetingmind-enterprise/
â”œâ”€â”€ index.html          # Entry point
â”œâ”€â”€ main.js             # Main application logic
â”œâ”€â”€ main.css            # Styles
â”œâ”€â”€ AuthService.js      # Authentication handling
â”œâ”€â”€ MeetingService.js   # Meeting operations
â”œâ”€â”€ ExportService.js    # Export functionality
â”œâ”€â”€ ai.js               # Anthropic AI integration
â”œâ”€â”€ audio.js            # Audio recording & speech recognition
â”œâ”€â”€ helpers.js          # Utility functions
â”œâ”€â”€ supabase.js         # Supabase client & database operations
â”œâ”€â”€ supabase-schema.sql # Database schema (run this first!)
â”œâ”€â”€ package.json        # Dependencies
â”œâ”€â”€ vite.config.js      # Vite build configuration
â””â”€â”€ vercel.json         # Vercel deployment configuration
```

---

## ðŸ”§ Local Development

```bash
npm install
npm run dev
```

---

## ðŸ“ Notes

- The Supabase credentials are currently hardcoded in `supabase.js` for easy testing
- For production, use environment variables
- AI features require an Anthropic API key

---

<div align="center">

**Built for teams who value their meeting time**

</div>
