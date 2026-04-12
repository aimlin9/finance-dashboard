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

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Python, Django, Django REST Framework | API, authentication, business logic |
| Database | SQLite (dev) / PostgreSQL (production) | Data storage |
| Auth | JWT via SimpleJWT | Secure token-based authentication |
| File Parsing | pdfplumber, pandas | Extract transactions from PDF/CSV |
| NLP | spaCy | Transaction categorization |
| Async Jobs | Celery + Redis | Background processing for file parsing |
| AI | Google Gemini 1.5 Flash | Financial insight generation |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui | User interface |
| Charts | Recharts | Data visualization |
| File Storage | Cloudflare R2 | Bank statement storage |
| Deployment | Railway (backend), Vercel (frontend) | Hosting |

## Project Status

🚧 **Currently in development** — building in public over 6 weeks.

- [x] Week 1 — Django setup, custom User model, JWT auth, admin panel
- [x] Week 2 — File parsing engine (PDF + CSV parsers, bank detection)
- [x] Week 3 — NLP categorization + Celery async pipeline
- [x] Week 4 — Analytics, monthly summaries, Gemini AI insights
- [ ] Week 5 — React frontend dashboard
- [ ] Week 6 — Polish, deploy, demo video

## Local Setup

### Prerequisites
- Python 3.10+
- Git

### Getting Started

```bash
# Clone the repo
git clone https://github.com/aimlin9/finance-dashboard.git
cd finance-dashboard/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements_dev.txt

# Run migrations
python manage.py makemigrations accounts
python manage.py migrate

# Create admin account
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

Visit `http://127.0.0.1:8000/admin/` to access the admin panel.

### Test the API

```bash
# Register a user
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "full_name": "Test User", "password": "TestPass123!", "password_confirm": "TestPass123!"}'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

## Why I Built This

Most personal finance tools are built for Western banks. In Ghana, there's no app that reads your GCB or MTN MoMo statement and tells you where your money is going. I built FinTrack Ghana to fill that gap — a tool that understands local bank formats and gives actionable insights in plain English.

## What I Learned

*This section will be updated as the project progresses.*

## Author

**Gyimah Ramsey Opoku**
- GitHub: [@aimlin9](https://github.com/aimlin9)

## License

MIT