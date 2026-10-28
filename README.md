# FinTrack Ghana

**Know where every cedi goes.** A full-stack personal finance app that reads Ghanaian bank and MoMo statements, sorts every transaction into categories, and turns a month of cryptic statement lines into something you can act on.

Most bank apps show a list of dates, amounts and reference codes like `300304******0000 Ref 0736`. FinTrack reads a GCB, Ecobank or MTN MoMo statement (or a CSV from any other bank) and shows where the money went, what repeats every month, what changed, and what to adjust.

- **Live app:** [finance-dashboard-phi-mauve.vercel.app](https://finance-dashboard-phi-mauve.vercel.app)

The API runs on a free tier that sleeps when idle, so the first visit after a quiet spell can take up to a minute; the app says so while it wakes.

## Features

**Reading statements**
- GCB, Ecobank and MTN MoMo statements as PDF or CSV, detected automatically
- A generic CSV importer that finds the header row itself, so Absa, Fidelity, Stanbic and other banks' exports work
- Handles Excel's UTF-8 BOM and Windows-1252 CSVs, and gives clear errors for locked PDFs and unreadable files
- Upload several statements at once; transactions already imported from an overlapping statement are skipped

**Categorizing**, in four layers, so nothing is guessed with false confidence:
1. The user's own rules, learned when they correct a transaction and choose "Remember"
2. ~200 Ghanaian merchants and keywords (Shoprite, Bolt, ECG, GWCL, Telecel, E-levy, KNUST…), matched on whole words
3. Transaction direction: money in is income or a transfer, never "food"
4. A spaCy text classifier, used only when the description shares vocabulary with its training data

Fourteen categories built for Ghana, including Church & Giving, Fees & Charges and Cash Withdrawal.

**Understanding the month**
- Overview: what was left over, money in vs out with month-over-month change, a cash-flow chart, spending by category, a daily spending calendar, spending by weekday, top payees, largest payments
- Signals: plain facts computed from your own numbers (fees and E-levy cost, cash share, biggest category change)
- Optional advisor note from Google Gemini, sent category totals only, never individual transactions
- Recurring payments grouped by payee, with cadence, next expected date and yearly cost
- Month comparison with a diverging category chart
- Budgets per category with suggested limits from your 3-month average, and alerts at 80% and 100%
- Savings goals with the monthly amount needed to hit a deadline
- A printable monthly report (or save as PDF), and CSV export of any filtered view

**App experience**
- Designed for phones first: bottom tab bar, swipe-to-dismiss sheets, safe-area aware on iPhone; installable to the home screen on Android and iOS
- Light and dark themes (or follow the device), a ⌘K / Ctrl K command palette, keyboard-accessible controls
- Transactions page with URL-synced filters, sorting, bulk recategorizing and notes
- Sessions refresh automatically; you can change your password, export everything and delete your account

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Django 5, Django REST Framework, SimpleJWT |
| Parsing | pdfplumber, pikepdf, a header-detecting CSV importer |
| Categorizing | Keyword rules + spaCy 3.7 text classifier |
| AI | Google Gemini 2.5 Flash |
| Database | SQLite locally, PostgreSQL in production |
| Frontend | React 19, Vite, Tailwind CSS 4, Zustand |
| UI | Recharts, Motion, vaul (sheets), cmdk (command palette), Fraunces / Instrument Sans / Geist Mono |
| Hosting | Render (API), Neon (Postgres), Vercel (web) — all free tiers |

## Local setup

**Prerequisites:** Python 3.12 (the pinned spaCy version does not build on 3.13) and Node.js 20+.

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # optional: add GEMINI_API_KEY for advisor notes
python manage.py migrate
python manage.py seed_categories
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev                         # http://localhost:5173, proxies /api to :8000
```

Try it with the sample statement at `frontend/public/sample-statement.csv`: three months of fictional transactions in GCB format.

### Tests and checks

```bash
cd backend && python manage.py test     # 60 tests
cd frontend && npm run lint && npm run build
```

The backend tests cover parsing (including BOM and generic CSVs), categorization regressions, duplicate skipping, learned rules, summary recomputation, budgets, goals, auth security (no reset-link leaks, password change, account deletion) and per-user data isolation.

## Configuration

All settings come from environment variables; see [`backend/.env.example`](backend/.env.example).

| Variable | Purpose |
|---|---|
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Standard Django settings |
| `DATABASE_URL` | PostgreSQL URL (SQLite when unset) |
| `FRONTEND_URL` | Used in password reset emails |
| `CORS_ALLOWED_ORIGINS` | Lock the API to your frontend (all origins allowed when unset) |
| `GEMINI_API_KEY` | Enables advisor notes |
| `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, … | SMTP for password resets (printed to the console when unset) |
| `VITE_API_URL` (frontend) | API base URL in production builds |

## Deploying (free tiers)

1. **Database:** create a free project on [Neon](https://neon.tech) and copy its connection string.
2. **API:** on [Render](https://render.com), New → Blueprint → this repo. [`render.yaml`](render.yaml) configures everything; paste the Neon string as `DATABASE_URL` and optionally a `GEMINI_API_KEY`. Migrations and category seeding run on each start, and `/api/health/` is the health check.
3. **Web:** on Vercel, set `VITE_API_URL` to `https://<your-render-service>.onrender.com/api` and redeploy.

The API runs one gunicorn worker with four threads: with spaCy loaded a worker peaks around 190 MB, inside the free 512 MB.

## API

<details>
<summary>Endpoints</summary>

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Create account, returns tokens |
| POST | `/api/auth/login/` | Get JWT tokens (rate limited) |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/me/` | View or update profile |
| POST | `/api/auth/password/change/` | Change password (requires current) |
| POST | `/api/auth/password-reset/` | Email a reset link |
| POST | `/api/auth/password-reset/confirm/` | Set new password |
| POST | `/api/auth/delete-account/` | Delete account and all data |

### Statements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/statements/upload/` | Upload a PDF or CSV |
| GET | `/api/statements/` | List statements |
| GET/DELETE | `/api/statements/{id}/` | View or delete (removes its transactions) |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions/` | Filters: `month`, `date_from`, `date_to`, `category`, `type`, `search`, `min_amount`, `max_amount`, `ordering`, `page_size` (≤1000) |
| PATCH | `/api/transactions/{id}/edit/` | Change category or note; optional `apply_to_similar`, `remember` |
| POST | `/api/transactions/bulk-categorize/` | Recategorize many |
| GET | `/api/transactions/export/` | CSV, accepts the list filters |
| GET | `/api/transactions/recurring/` | Recurring payments |
| GET | `/api/transactions/categories/` | Category list |
| GET/DELETE | `/api/transactions/rules/` | Learned category rules |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard/?month=YYYY-MM` | Month summary, daily/weekday spending, payees, largest payments, previous month |
| GET | `/api/analytics/monthly/` | Months with data |
| GET | `/api/analytics/trend/` | Every month's totals |
| GET | `/api/analytics/compare/?month1=&month2=` | Two months side by side |
| GET | `/api/analytics/insights/?month=` | Advisor note (Gemini) |
| GET | `/api/analytics/budget/?month=` | Budgets with spending |
| POST | `/api/analytics/budget/set/`, `/budget/remove/` | Manage budgets |
| GET/POST, PATCH/DELETE | `/api/analytics/savings-goals/`, `/{id}/` | Savings goals |

</details>

## How an upload works

```
PDF / CSV upload
  → bank detected from file name and content
  → bank-specific parser, or the generic CSV importer
  → transactions already imported are skipped
  → categorized: your rules → keywords → direction → spaCy
  → saved atomically, monthly summaries recomputed
  → dashboard, budgets, recurring and reports update
```

## Why I built this

Personal finance tools are built for Western banks. In Ghana there was no app that reads a GCB or MTN MoMo statement and tells you, in plain language, where your money is going. FinTrack is built to understand local formats and local spending: trotro and Bolt, ECG tokens, E-levy, church, and the transfer home.

## Author

**Gyimah Ramsey Opoku** · [GitHub @aimlin9](https://github.com/aimlin9)

## License

MIT
