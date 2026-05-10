# 🏨 HostelHub

**A full-stack hostel management system built with Next.js, FastAPI, and PostgreSQL**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JWT Auth](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

---

## 📑 Table of Contents
- [📖 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🗄️ Database Architecture](#️-database-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [📚 API Documentation](#-api-documentation)
- [👤 Default Credentials](#-default-credentials)
- [👨‍💻 Team](#-team)
- [🎓 Academic Info](#-academic-info)

---

## 📖 Overview
HostelHub is a comprehensive, full-stack management solution tailored for university hostel environments. It empowers students with tools to handle daily operations like submitting maintenance requests, buying and selling items, voting on polls, and accessing important guidelines. For administrators, it offers robust control over user verification, ticketing workflows, community moderation, and broadcast safety alerts, solving the fragmentation often found in campus residential management.

---

## ✨ Features

| Module | Description |
| :--- | :--- |
| 🏠 **Dashboard** | A centralized overview with real-time statistics and personalized quick actions. |
| 🛒 **Marketplace** | Buy and sell items within the hostel community securely. |
| 🔧 **Maintenance Tickets** | Report, track, and manage room repairs and maintenance requests. |
| 🔍 **Lost & Found** | Report lost items or post found items to reconnect them with their owners. |
| 📅 **Events** | Discover, RSVP, and manage upcoming hostel events and gatherings. |
| 💬 **Community** | Engage in discussions, create posts, and vote on community polls. |
| 📖 **Guidebook** | Access essential hostel rules, guidelines, and emergency contacts. |
| 🚨 **Safety Alerts** | Receive immediate, system-wide notifications for critical safety information. |
| 🔔 **Notifications** | Stay updated with real-time alerts for orders, tickets, and community interactions. |
| 🛡️ **Admin Panel** | Comprehensive moderation, verification, and settings management for staff. |

---

## 🛠️ Tech Stack

### 💻 Frontend
![Next JS](https://img.shields.io/badge/Next-black?style=flat-square&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white) ![Framer](https://img.shields.io/badge/Framer-black?style=flat-square&logo=framer&logoColor=blue)
- **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Framer Motion**

### ⚙️ Backend
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi) ![Python](https://img.shields.io/badge/python-3670A0?style=flat-square&logo=python&logoColor=ffdd54) ![JWT](https://img.shields.io/badge/JWT-black?style=flat-square&logo=JSON%20web%20tokens)
- **FastAPI**, **Python**, **psycopg3** (async driver), **JWT** Authentication

### 🗄️ Database
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=flat-square&logo=postgresql&logoColor=white)
- **PostgreSQL 15**, **PL/pgSQL**

---

## 🗄️ Database Architecture

Our robust PostgreSQL database leverages advanced PL/SQL components to ensure data integrity and complex business logic directly at the database layer.

### Stored Procedures
| Procedure | Parameters | Description |
| :--- | :--- | :--- |
| `get_student_summary` | `p_user_id` (IN), `p_ticket_count` (OUT), `p_order_count` (OUT), `p_post_count` (OUT), `p_unread_notifications` (OUT) | Fetches aggregate user statistics for the dashboard efficiently. |
| `process_order_cancellation`| `p_order_id` (IN), `p_user_id` (IN), `p_success` (OUT), `p_message` (OUT) | Handles safe cancellation of orders with inventory rollback. |

### Key Functions
| Function | Return Type | Purpose |
| :--- | :--- | :--- |
| `register_user` | `RECORD` | Handles user creation with initial state setup and secure hashing. |
| `update_ticket_status` | `BOOLEAN` | Updates maintenance ticket statuses with necessary checks. |
| `place_order` | `RECORD` | Processes new orders, validating quantity and handling logic. |
| `get_poll_percentage` | `DECIMAL` | Calculates dynamic voting percentages for community polls. |
| `get_student_order_count`| `INTEGER` | Returns total marketplace orders placed by a specific student. |
| `is_item_archived` | `BOOLEAN` | Checks if a specific lost & found item is marked as archived. |

### Triggers
| Trigger | Event | Purpose |
| :--- | :--- | :--- |
| `trg_ticket_notification` | `AFTER UPDATE` | Notifies users automatically when their ticket status changes. |
| `trg_prevent_self_order` | `BEFORE INSERT` | Prevents sellers from placing orders on their own listings. |
| `trg_updated_at` | `BEFORE UPDATE` | Automatically updates the `updated_at` timestamp on row modification. |
| `trg_auto_archive_items` | `BEFORE UPDATE` | Automatically marks resolved lost & found items as archived. |
| `trg_notify_post_like` | `AFTER INSERT` | Generates a notification when a community post receives a like. |

### Explicit Cursors
| Cursor | Description |
| :--- | :--- |
| `cur_overdue` | Iterates over unresolved tickets/items past a specific timeframe to automatically flag or archive them in a scheduled maintenance routine. |

---

## 📁 Project Structure

```text
hostel-hub/
├── backend/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── maintenance/
│   │   ├── marketplace/
│   │   ├── community/
│   │   ├── events/
│   │   ├── lost_found/
│   │   ├── notifications/
│   │   ├── safety_alerts/
│   │   └── settings/
│   └── main.py
├── components/
│   └── dashboard/
├── database/
│   └── hostelhub.sql
├── diagrams/
│   ├── ERD.png
│   └── EERD.png
└── README.md
```

---

## 🚀 Getting Started

<details>
<summary>🗄️ Database Setup</summary>

1. Install PostgreSQL 15 or higher.
2. Create a new database named `hostelhub`.
3. Run the provided SQL script to construct tables, functions, triggers, and seed data:
   ```bash
   psql -U postgres -d hostelhub -f database/hostelhub.sql
   ```
</details>

<details>
<summary>⚙️ Backend Setup</summary>

1. Navigate to the `backend` directory.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the `.env` variables (see below).
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
</details>

<details>
<summary>🖥️ Frontend Setup</summary>

1. Navigate to the root directory (`hostel-hub`).
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env.local` variables (see below).
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
</details>

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql+psycopg3://user:pass@localhost/hostelhub`) |
| `SECRET_KEY` | Secret key for JWT signing |
| `ALGORITHM` | Hashing algorithm (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Expiry duration for access tokens (`30`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiry duration for refresh tokens (`7`) |

### Frontend (`.env.local`)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (`http://localhost:8000`) |

---

## 📚 API Documentation

FastAPI automatically generates interactive API documentation. When the backend is running, access it here:

[![Swagger API Docs](https://img.shields.io/badge/Swagger%20UI-API%20Docs-85EA2D?style=for-the-badge&logo=swagger)](http://localhost:8000/docs)

---

## 👤 Default Credentials

Use these credentials to explore the admin functionality immediately:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `[admin email]` | `[admin password]` |

---

## 👨‍💻 Team

| Name | Student ID | Role |
| :--- | :--- | :--- |
| **Bilal Rauf** | 24F-0508 | Full-Stack Developer & Database Architect |
| **Wajeeha Sajid** | 24F-0806 | Full-Stack Developer & UI/UX Designer |

---

## 🎓 Academic Info

| | |
| :--- | :--- |
| **Subject** | Database Systems |
| **Institution** | FAST NUCES |
| **Academic Year** | 2025-2026 |
| **Submission Date** | May 2026 |
