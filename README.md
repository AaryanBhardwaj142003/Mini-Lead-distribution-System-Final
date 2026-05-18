# Modern Lead Management CRM

A real-time, role-based Lead Management system built with React, TypeScript, Tailwind CSS, and Firebase. This application allows administrators to manage sales agents, distribute incoming leads, and track the status of leads in real-time, while providing agents with a dedicated dashboard to update and manage their assigned prospects.

## Features

*   **Role-Based Access Control (RBAC):** Secure entry with distinct portals for `admin` and `agent` roles.
*   **Admin Dashboard:**
    *   High-level overview of total leads, active leads, and closed deals.
    *   Create and distribute new leads to specific agents.
    *   Agent management (add and register new agents to the platform).
*   **Agent Dashboard:**
    *   View all assigned leads in real-time updates.
    *   Update lead statuses (e.g., New, Contacted, Negotiating, Closed) seamlessly.
*   **Real-Time Data:** Powered by Firebase Firestore for instant UI updates across all connected clients without refreshing.
*   **Modern UI:** Responsive, accessible, and clean interface built with Tailwind CSS.

## Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Backend & DB:** Firebase (Authentication, Firestore)
*   **Routing:** React Router v6

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/lead-management-crm.git
    cd lead-management-crm
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Firebase Configuration:**
    Ensure you have your Firebase project set up. For this project, Firebase config is read realistically via a `firebase-applet-config.json` in the root directory (or you can adapt standard environment variables).
    ```json
    {
      "apiKey": "YOUR_API_KEY",
      "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
      "projectId": "YOUR_PROJECT_ID",
      "storageBucket": "YOUR_PROJECT_ID.appspot.com",
      "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
      "appId": "YOUR_APP_ID"
    }
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Default Roles & Security

Roles are assigned via a `users` collection in Firestore.
*   During sign-up or admin-based creation, a user document is created mapping the Firebase Auth UID to a role (`admin` or `agent`).
*   Firestore security rules protect the `/leads` and `/users` collections ensuring that users can only access what they are permitted to.

## Project Structure

*   `/src/pages/Admin/` - Admin views, Lead creation, and Agent management.
*   `/src/pages/Agent/` - Agent dashboard and controls.
*   `/src/components/` - Reusable UI components including the unified Lead Table.
*   `/src/lib/` - Firebase initialization and helper utilities.

## License

This project is licensed under the MIT License.
