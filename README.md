# ContractOS — Contract Intelligence System

A SaaS platform for uploading, parsing, and managing contracts with AI-powered obligation tracking and expiry alerts.

---

## Features

- **Contract Upload** — Upload PDF contracts via the web dashboard
- **AI Parsing** — Claude (Anthropic) extracts key terms, parties, dates, and obligations automatically
- **Obligation Tracking** — View and manage obligations extracted from each contract
- **Expiry Alerts** — Automated scheduler checks for contracts nearing expiry and sends notifications
- **Dashboard** — Central view of all contracts, statuses, and upcoming deadlines

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Scheduler | Node.js cron script |
| Storage | Supabase Storage / local `storage/contracts/` |

---

## Installation

### Prerequisites
- Node.js 18+
- A Supabase project
- An Anthropic API key

### Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd contract-os
   ```

2. **Install web app dependencies**
   ```bash
   cd apps/web
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and fill in your Supabase URL, Supabase key, and Claude API key
   ```

4. **Set up the database**
   - Open your Supabase project dashboard
   - Navigate to the SQL Editor
   - Paste and run the contents of `database/schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   # App runs at http://localhost:3000
   ```

---

## Adding Your First Contract

1. Open `http://localhost:3000` in your browser
2. Click **Upload Contract** on the dashboard
3. Select a PDF file from your machine
4. The system will upload the file and invoke the AI parser
5. Claude extracts parties, key dates, obligations, and renewal terms
6. The parsed contract appears in your dashboard with all fields populated
7. Review obligations and set any manual reminders as needed

---

## Running the Expiry Scheduler

The scheduler checks all contracts for upcoming expiry dates and can trigger alerts:

```bash
node services/scheduler/checkContracts.js
```

Run this on a cron schedule (e.g., daily at 8 AM):

```cron
0 8 * * * /usr/bin/node /path/to/contract-os/services/scheduler/checkContracts.js
```

---

## Project Structure

```
contract-os/
├── apps/
│   └── web/                      # Next.js frontend application
│       ├── src/
│       │   └── app/
│       │       ├── api/          # API routes (upload, parse, contracts)
│       │       ├── components/   # Reusable React components
│       │       ├── layout.tsx    # Root layout
│       │       ├── page.tsx      # Dashboard home page
│       │       ├── supabase.ts   # Supabase client setup
│       │       └── utils.ts      # Shared utility functions
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
├── database/
│   └── schema.sql                # Supabase table definitions
├── services/
│   ├── ai-parser/
│   │   └── parser.js             # Claude-powered contract parser
│   └── scheduler/
│       └── checkContracts.js     # Expiry alert scheduler
├── storage/
│   └── contracts/                # Local PDF storage (gitignored)
├── .env.example                  # Environment variable template
└── README.md
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase service role or anon key (server-side) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL exposed to the browser |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase anon key exposed to the browser |
| `CLAUDE_API_KEY` | Anthropic Claude API key |
| `ANTHROPIC_API_KEY` | Alias for Claude API key (used by `@anthropic-ai/sdk`) |

Copy `.env.example` to `.env.local` in both the repo root and `apps/web/` and fill in your values. Never commit `.env.local` to version control.
