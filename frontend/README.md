# R.O.A.R Championship Registration System

Web app for registering competitors, building teams, and managing payments for R.O.A.R Taekwondo championships.

## Stack
- Vite + React 18 + Tailwind CSS
- React Router v6, React Hook Form
- Frontend-only for now — structured for MariaDB backend (port 3306)

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

**Demo credentials**
| Role | Email | Password |
|---|---|---|
| Team Manager | `tm@roar.my` | `password123` |
| Admin | `admin@roar.my` | `admin123` |

## Project structure

```
src/
├── contexts/        AuthContext (mock auth, swap for API later)
├── components/ui/   Shared UI: Btn, Chip, Field, Table, TopBar, SideNav…
├── pages/
│   ├── auth/        Login, Register
│   ├── tm/          EventPicker, EventHome, AddCompetitor, TeamBuilder, FeesPayment
│   └── admin/       AdminEventList, CreateEvent, AdminEventDashboard, CategoryOverride
├── utils/
│   ├── categoryRules.js   ITF auto-derive: age category, belt group, weight class
│   ├── navSections.js     Shared side-nav config for TM pages (single source of truth)
│   └── format.js          formatDate, formatMYR, maskIC helpers
└── data/            Mock data — each file has a BACKEND comment showing what to replace
```

## Environment variables (future backend)

Copy `.env.example` to `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=roar_db
DB_USER=
DB_PASS=
```
