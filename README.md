# WeGrow HR & Payroll Portal — Campus & B-School

This project is built with **Next.js 15 (App Router)** and **React 19** with full TypeScript support and Tailwind CSS v4.

## Architecture

- **Next.js 15 App Router** (`src/app/`):
  - Fast client and server page routing, optimized layout caching, and route transition handling.
  - Root Layout (`src/app/layout.tsx`) with Google Fonts (Sora & Work Sans), global metadata, and context providers.
  - Dynamic client-side navigation using `next/link` and `next/navigation`.
- **React Components** (`src/components/views/*.tsx`, `src/components/ui/*.tsx`, `src/components/layout/*.tsx`):
  - Interactive UI components (Live punch in/out, biometric synchronization, timesheet matrix, modals, live filters).
  - Speech synthesis mascot greeting.
  - State management via React Auth Context & Toast Context.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`.

## Available Pages / Routes

| Route | Description |
|---|---|
| `/` | Portal auto-routing & authentication redirect |
| `/login` | Authentication console with Persona demo switcher |
| `/dashboard` | Interactive Role-Aware KPI Dashboard & Live Mascot |
| `/attendance` | Biometric Logs, Regularisation Requests, Master Sheet |
| `/leave` | Balances, Applications & Multi-tier Approvals |
| `/payroll` | Compensation breakdown, payslips & PDF generation |
| `/employees` | Faculty and staff directory & onboarding |
| `/timesheets` | Weekly timesheet entry matrix & manager signoffs |
| `/tasks` | Kanban task board with status workflows |
| `/expenses` | Daily campus bills & reimbursement claims |
| `/reimbursements` | Staff claim submissions |
| `/helpdesk` | Support tickets for IT, HR and Payroll |
| `/documents` | Vault for compliance records & assigned hardware assets |
| `/announcements` | Campus circulars, event RSVP & travel booking |
| `/feedback` | Confidential feedback channel to CEO leadership |
| `/reports` | Executive audit reports and CSV muster rolls |
| `/settings` | Biometric terminal connectors & shift policies |
| `/profile` | User profile & security credential updates |

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 3. Build for Production
```bash
npm run build
```

### 4. Start Production Server
```bash
npm run start
```
