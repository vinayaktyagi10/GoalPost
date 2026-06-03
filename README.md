# GoalPost ⚽
### In-House Goal Setting & Tracking Portal
> AtomQuest Hackathon 1.0 — Solo Submission

**Live Demo:** https://goal-post-mauve.vercel.app  
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase · Vercel · Resend · Microsoft Entra ID

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Employee | employee@demo.com | Demo@1234 |
| Manager | manager@demo.com | Demo@1234 |
| Admin / HR | admin@demo.com | Demo@1234 |

> **Microsoft SSO** is also enabled — click "Sign in with Microsoft" on the login page. Any Microsoft account is supported and auto-provisioned as Employee.

---

## Features

### Phase 1 — Goal Creation & Approval
- Employee interface to create goals with Thrust Area, Title, UoM, Target, and Weightage
- All 4 UoM types supported: Numeric (Min/Max), Timeline, Zero-based
- System-enforced validation rules:
  - Total weightage must equal exactly 100%
  - Minimum weightage per goal: 10%
  - Maximum goals per employee: 8
- Manager (L1) approval workflow with inline editing of targets and weightages
- Goals locked on approval — no edits without Admin intervention
- Admin unlock capability with full audit logging
- Shared Goals — admin pushes KPI to multiple employees; recipients adjust weightage only; achievement updates sync across all linked goal sheets

### Phase 2 — Achievement Tracking & Check-ins
- Quarterly achievement input per goal (Q1–Q4)
- Manual status selection: Not Started / On Track / Completed
- System-computed progress scores using all 4 formulas:
  - **Min** → `Achievement ÷ Target × 100`
  - **Max** → `Target ÷ Achievement × 100`
  - **Timeline** → `Completion date ≤ Deadline ? 100% : 0%`
  - **Zero** → `Actual = 0 ? 100% : 0%`
- Manager check-in module with Planned vs Actual grid
- Structured check-in comments per goal per quarter
- Employee view of manager feedback on goal detail page

### Reporting & Governance
- Achievement report exportable as CSV (Planned vs Actual for all employees)
- Real-time completion dashboard with org-wide stats
- Full audit trail — logs every post-lock change with who, what, when
- Audit log with date range and text search filters

### Good-to-Have Bonus Features
- **Microsoft Entra ID SSO** — OAuth 2.0 via Azure Student subscription, any MS account supported, auto user provisioning
- **Email Notifications** — goal submission, approval, return, unlock, escalation via Resend (toolden.xyz verified domain)
- **Escalation Module** — configurable rules (goal not submitted, not approved, check-in not completed), violation checker, escalation log, manager email alerts
- **Analytics Module** — QoQ achievement trends, goal distribution by thrust area, completion heatmap, manager effectiveness dashboard
- **User Management** — admin assigns roles to SSO users
- **Role-coloured sidebar** — user profile with initials avatar, name, role badge

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions, API Routes |
| Database | Supabase (PostgreSQL) — ap-south-1 Mumbai |
| Auth | Supabase Auth + Microsoft Entra ID (OAuth 2.0) |
| Email | Resend SDK, toolden.xyz verified sending domain |
| Charts | Recharts |
| CSV Export | Papaparse |
| Hosting | Vercel (free tier, auto-deploy from GitHub) |

**Total infrastructure cost: $0/month** — all services on permanent free tiers.

---

## Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions (goals, manager, admin, achievements)
│   ├── admin/            # Admin pages (dashboard, analytics, audit, escalations)
│   ├── employee/         # Employee pages (goals, checkin, goal detail)
│   ├── manager/          # Manager pages (team, goals review, checkin)
│   ├── api/              # API routes (escalation check)
│   ├── auth/callback/    # Microsoft SSO OAuth callback
│   └── login/            # Login page + actions
├── components/
│   ├── admin/            # Analytics charts, export button, goal management
│   ├── goals/            # Goal form, status badge, quarterly input, etc.
│   └── layout/           # Sidebar with user profile
└── lib/
    ├── supabase/         # Server, client, middleware clients
    ├── utils/            # Progress score calculator, quarter utils
    └── email.ts          # Resend email wrapper
```

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- A Supabase project
- A Resend account
- A Microsoft Azure app registration (for SSO)

### Setup

```bash
# Clone the repository
git clone https://github.com/vinayaktyagi10/GoalPost.git
cd GoalPost

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_QUARTER=Q2
RESEND_API_KEY=your_resend_api_key
```

### Database Setup

Run the schema SQL in your Supabase SQL Editor — all table definitions, RLS policies, and triggers are in `supabase_setup.sql` at the root of the repository.

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to login page.

---

## Deployment

The app is deployed on Vercel with automatic deployments on every push to `main`.

```bash
# Deploy manually
vercel --prod
```

Required Vercel environment variables — same as above plus:
```
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_QUARTER=Q2
```

---

## Architecture

```
Browser (Employee / Manager / Admin)
         │
         │ HTTPS
         ▼
  Vercel (Next.js 14)
  ├── App Router (SSR + Server Actions)
  └── Proxy Middleware (Auth guard, role routing)
         │
         ├──────────────────────────────┐──────────────────┐
         ▼                              ▼                  ▼
  Supabase                     Microsoft Entra ID       Resend
  ├── PostgreSQL (5 tables)     OAuth 2.0 / OIDC        Email API
  └── Auth (JWT sessions)       Any MS account          toolden.xyz
```

---

## Notes

- **RLS** (Row Level Security) policies are fully defined in the schema. Disabled in the demo environment for stability — re-enable in production.
- **Quarterly windows** are enforced by `isQuarterlyWindowActive()`. `NEXT_PUBLIC_DEMO_MODE=true` bypasses this for demo purposes.
- **Escalation check** is triggered manually via the admin panel. In production, a Vercel Cron job would run this daily.
- **Microsoft SSO** requires an Azure app registration. Configured with Azure Student subscription — any Microsoft account can authenticate.

---

## License

Built for AtomQuest Hackathon 1.0. Solo submission.
