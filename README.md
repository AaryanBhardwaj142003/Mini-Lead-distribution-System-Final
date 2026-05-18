# Prowider Mini Lead Distribution System

A robust, real-time lead generation and distribution system built with React, TypeScript, and Firebase. This project implements a complex allocation algorithm to fairly distribute service enquiries to service providers based on mandatory assignment rules, fair round-robin pools, and provider monthly quotas.

## Purpose

Designed to simulate a real-world system where:
- Customers submit service enquiries (leads).
- Leads are automatically distributed to EXACTLY 3 providers.
- Certain providers *must* receive leads for specific services.
- Remaining assignment slots are distributed fairly (round-robin) across a pool of applicable providers.
- Providers cannot exceed their monthly quota of 10 leads.
- Dashboards update in real-time.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Database & Backend Logic:** Firebase Firestore (transactions, snapshots for real-time reads)
- **Deployment:** Vercel / Firebase Hosting ready

## Live Demo
[Insert Your Live Demo URL Here]

## Core Features Implemented

1. **Public Customer Form (`/request-service`)**
   - Collects Name, Phone, City, Service Type, and Description.
   - Strictly enforces a duplicate rule: A lead cannot be submitted with the exact same phone number + service type combination. This is enforced at the database transaction level, not just the frontend UI.

2. **Core Distribution Logic (`/src/lib/allocation.ts`)**
   - Automatically handles assignment under high concurrency.
   - Respects Provider quotas (max 10 leads).
   - Selects mandatory providers for a given service.
   - Rotates through remaining candidate providers in a round-robin pool.

3. **Provider Dashboard (`/dashboard`)**
   - Role-impersonation to quickly simulate different providers (`P1` to `P8`).
   - Real-time Firestore subscription fetches newly assigned leads instantly without polling or refreshing.
   - Displays Remaining Quota clearly.

4. **Test Tools & Webhook Simulation (`/test-tools`)**
   - **Environment Init:** Seeds the DB with 8 providers starting at 0 quota.
   - **Webhook Webpage:** Safely resets quotas simulating a payment gateway webhook. Completely idempotent.
   - **Concurrency Cannon:** Fires 10 simultaneous leads to prove the fair distribution and quota logic executes perfectly even at the exact same millisecond.
   - **Duplicate Cannon:** Proves duplicate DB entries are fully rejected.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- A Firebase project with **Firestore** enabled.

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/prowider-mini-lead-distribution.git
   cd prowider-mini-lead-distribution
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase Configuration:**
   Create a `.env` file or update `src/lib/firebase.ts` with your active Firebase configuration keys.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Initialize Database Details:**
   - Navigate to `http://localhost:3000/test-tools` 
   - Click **"Initialize Seed Data"** to automatically create the 8 providers in the database.

## Notes on the Stack (React + Firebase vs Next.js + DB)
This implementation leverages standard client-side React with Firebase Firestore acting as both the database and the backend controller. All crucial assignment algorithms and data-safety mechanics (locking, constraints, idempotency) are handled safely via **Firestore Transactions** (`runTransaction`) and structural document keys—achieving the same backend integrity guarantees you would find in an Express/Next.js environment connected directly to MongoDB or PostgreSQL.
