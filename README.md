# FinTrack Ghana 🇬🇭

**A full-stack personal finance dashboard that automatically parses Ghanaian bank statements, categorizes transactions using NLP, and delivers AI-powered spending insights.**

Most Ghanaians have no clear picture of where their money goes. Bank apps show raw transactions but offer zero analysis. FinTrack Ghana solves this — upload a bank statement (PDF or CSV) and within minutes get a complete spending breakdown, category insights, and personalized financial advice powered by AI.

## What It Does

- **Automatic Statement Parsing** — Upload a PDF or CSV from GCB, Ecobank, MTN MoMo, Absa, or Fidelity. The system extracts every transaction automatically.
- **NLP Categorization** — Transactions are classified into categories (Food, Transport, Utilities, Health, etc.) using keyword rules and a trained spaCy text classifier.
- **Spending Dashboard** — Visualize your spending with pie charts, bar charts, and income vs. expense summaries built with Recharts.
- **AI Financial Insights** — Google Gemini analyzes your spending patterns and gives plain-English advice like "You spent 40% more on food in March."
- **Budget Tracking** — Set monthly budgets per category with progress bars and alerts at 80% and 100%.
- **Month-over-Month Comparison** — Compare spending across any two months side by side.
- **CSV Export** — Download your transactions as a clean CSV file.
- **Password Reset** — Secure token-based password reset flow.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Python, Django, Django REST Framework | API, authentication, business logic |
| Database | SQLite (dev) / PostgreSQL (production) | Data storage |
| Auth | JWT via SimpleJWT | Secure token-based authentication |
| File Parsing | pdfplumber, pandas | Extract transactions from PDF/CSV |
| NLP | spaCy | Transaction categorization |
| AI | Google Gemini 2.5 Flash | Financial insight generation |
| Frontend | React, Vite, Tailwind CSS | User interface |
| Charts | Recharts | Data visualization |

## Project Status

🚧 **Currently in development** — building in public over 6 weeks.

- [x] Week 1 — Django setup, custom User model, JWT auth, admin panel
- [x] Week 2 — File parsing engine (PDF + CSV parsers, bank detection)
- [x] Week 3 — NLP categorization (keyword rules + spaCy classifier)
- [x] Week 4 — Analytics, monthly summaries, Gemini AI insights
- [x] Budget tracking with progress and alerts
- [x] CSV export for transactions
- [x] Password reset flow
- [ ] Week 5 — React frontend dashboard
- [ ] Week 6 — Polish, deploy, demo video

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create new account |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/me/` | View/update profile |
| POST | `/api/auth/password-reset/` | Request password reset |
| POST | `/api/auth/password-reset/confirm/` | Set new password |

### Statements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/statements/upload/` | Upload PDF or CSV |
| GET | `/api/statements/` | List all statements |
| GET | `/api/statements/{id}/status/` | Check processing status |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | List with filters (?month, ?category, ?type, ?search) |
| PATCH | `/api/transactions/{id}/edit/` | Correct a category |
| GET | `/api/transactions/export/` | Download as CSV |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard/` | Monthly summary + breakdown |
| GET | `/api/analytics/monthly/` | Available months |
| GET | `/api/analytics/compare/` | Compare two months |
| GET | `/api/analytics/insights/` | AI-generated insights |
| GET | `/api/analytics/budget/` | Budget progress per category |
| POST | `/api/analytics/budget/set/` | Set budget limit |

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements_dev.txt
pip install spacy pdfplumber google-genai python-decouple pikepdf
python -m spacy download en_core_web_sm
python manage.py makemigrations accounts statements transactions analytics
python manage.py migrate
python manage.py seed_categories
python manage.py createsuperuser
python manage.py runserver
```

Create a `.env` file in `backend/`:
GEMINI_API_KEY=AIzaSyCJasP1aNUiHgErkdkVZZTi-AwzAzLE6eU

### Testing

```bash
python manage.py test
```

29 tests covering CSV parsing, bank detection, and transaction categorization.

## Architecture

User uploads PDF/CSV
→ Bank detector identifies format
→ Parser extracts transactions
→ NLP categorizer assigns categories (keywords → spaCy fallback)
→ Transactions saved to database
→ Monthly summary computed
→ Gemini AI generates spending insights
→ Dashboard displays charts and advice

## Why I Built This

Most personal finance tools are built for Western banks. In Ghana, there's no app that reads your GCB or MTN MoMo statement and tells you where your money is going. I built FinTrack Ghana to fill that gap — a tool that understands local bank formats and gives actionable insights in plain English.

## What I'd Add Next

- Celery + Redis for async file processing
- Cloudflare R2 for cloud file storage
- WhatsApp monthly summary via Twilio
- Multi-bank support with more parser formats
- Savings goal tracker
- Email notifications for budget alerts

## Author

**Gyimah Ramsey Opoku**
- GitHub: [@aimlin9](https://github.com/aimlin9)

## License

MIT