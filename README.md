# AI Smart Health Kiosk

**Presented by LAXMIPOOJA TECH COMPANY**

A multilingual health-kiosk prototype that helps patients share health information and gives care teams a clear way to review completed cases.

> **Prototype scope:** The guided intake records patient-provided information. It does not diagnose conditions or recommend treatment. No external AI model or SMS/email OTP provider is configured.

## Features

- Patient sign-in by mobile number or email, with role-aware OTP verification.
- Patient profile, health information, guided case intake, follow-up questions, and case history.
- Care-team queue with patient/case search, review-status filters, oldest/newest sorting, and review notes.
- Read-only administrator overview of account and case counts.
- App-wide language selection in English, Telugu, Hindi, Kannada, and Tamil. The selected language is remembered between pages.
- Responsive layouts and a PostgreSQL-backed Express API.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |

## Run locally

### Requirements

- Node.js 22.12 or newer in the Node 22 line (or Node.js 20.19 or newer).
- PostgreSQL 14 or newer.

### 1. Create the database

Create a local database named `ai_smart_health_kiosk`, then run [`database/schema.sql`](database/schema.sql) against it. For example, from a shell with PostgreSQL command-line tools installed:

```sh
createdb ai_smart_health_kiosk
psql -d ai_smart_health_kiosk -f database/schema.sql
```

### 2. Configure the backend

```sh
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your local PostgreSQL username and password. Keep `.env` files out of commits; the repository ignores them.

### 3. Install dependencies

Run these commands from the repository root:

```sh
npm ci --prefix backend
npm ci --prefix frontend
```

### 4. Start the app

Open two terminals at the repository root.

Terminal 1 — API:

```sh
cd backend
npm run dev
```

Terminal 2 — web app:

```sh
cd frontend
npm run dev
```

Open <http://localhost:5173>. The API health check is available at <http://localhost:5000/api/health>.

The frontend defaults to `http://localhost:5000/api`. To use another API address, copy `frontend/.env.example` to `frontend/.env.local`, set `VITE_API_URL`, and restart Vite.

## Local demo accounts

Sign-in is available to accounts already in the database. Create synthetic local accounts with SQL such as:

```sql
INSERT INTO users (full_name, email, role)
VALUES ('Demo Patient', 'demo-patient@example.test', 'PATIENT');

INSERT INTO users (full_name, email, role)
VALUES ('Demo Care Team', 'demo-care-team@example.test', 'DOCTOR');
```

Use `ADMIN` for an administrator account. In development mode, the OTP is shown in the app; email and SMS delivery are not configured. Do not use real patient accounts or health information for demos.

## Quality checks

Run the frontend checks from the repository root:

```sh
npm run lint --prefix frontend
npm run build --prefix frontend
```

GitHub Actions runs these frontend checks and checks backend JavaScript syntax on pushes and pull requests to `main`.

## Repository layout

```text
backend/             Express API and PostgreSQL access
database/schema.sql  Database schema
frontend/            React and Vite application
.github/workflows/   GitHub Actions validation
```

## Upload this repository to GitHub

1. Create an **empty** repository on GitHub. The local project already has its README and Git history, so do not initialize the GitHub repository with another README.
2. From this project folder, add your repository as `origin` and push the `main` branch:

```sh
git remote add origin https://github.com/<YOUR-USERNAME>/<REPOSITORY-NAME>.git
git push -u origin main
```

Before making a repository public, confirm that it contains no `.env` files, credentials, database backups, real patient details, or screenshots with personal health information. Choose a license before inviting others to reuse or contribute to the project.
