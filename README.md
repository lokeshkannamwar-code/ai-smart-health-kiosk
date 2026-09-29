# AI Smart Health Kiosk

A local full-stack kiosk prototype for patient sign-in, health records, guided case intake, and care-team review.

## What works

- Role-aware OTP sign-in for registered patient, doctor, and administrator accounts.
- Patient health profile and case history stored in PostgreSQL.
- A guided follow-up interview that saves each answer and can be resumed.
- A doctor review queue with optional notes, and a read-only administrator overview.
- Session validation, logout, role-protected API endpoints, and a database health endpoint.

The guided intake organizes patient-provided information. It does not diagnose or recommend treatment. No external AI model or SMS/email delivery provider is configured in this repository.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- PostgreSQL 14+

## First-time setup

1. Create a PostgreSQL database, for example **ai_smart_health_kiosk**.
2. Run **database/schema.sql** against that database.
3. Copy **backend/.env.example** to **backend/.env** and enter your local PostgreSQL connection values. Do not commit **.env**.
4. Install dependencies in the backend and frontend folders with **npm install**.
5. In one terminal, start the backend from the backend folder with **npm run dev**.
6. In another terminal, start the frontend from the frontend folder with **npm run dev**.
7. Open the Vite address (normally http://localhost:5173).

To point the frontend at a different API address, add **VITE_API_URL=http://localhost:5000/api** to **frontend/.env.local** and restart Vite.

## Add local accounts

Sign-in is for existing accounts provisioned by the care team. Create a local test account with SQL such as:

INSERT INTO users (full_name, email, role) VALUES ('Demo Patient', 'patient@example.test', 'PATIENT');

Use role **DOCTOR** for a care-team account or **ADMIN** for an administrator account. In development mode, the OTP endpoint returns a short-lived code to the browser. OTP delivery is not connected to email or SMS. Before production, integrate a verified delivery provider, set **NODE_ENV=production**, and review the deployment security settings.

## API health

Open http://localhost:5000/api/health. A successful response reports both API and PostgreSQL status.

## Project layout

- **frontend/** — React and Vite application
- **backend/** — Express API and PostgreSQL access
- **database/schema.sql** — initial database schema
