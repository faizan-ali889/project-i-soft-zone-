# 🚀 Employee Profile & IT Asset Management System

A production-grade Enterprise HRMS and IT Inventory tracking full-stack web application. Built with **React**, **Node.js/Express**, and **PostgreSQL**, implementing secure multi-role clearances, transactional database workflows, and advanced reports metrics.

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Enterprise Architecture](#enterprise-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Database Relationships](#database-relationships)
- [Security Features](#security-features)
- [Deployment](#deployment)

---

## ✨ Features

### 🔐 Authentication & Role Access
- **Multi-Role Security**: Clearance clearances for **Admin**, **HR**, **Manager**, and **Employee** roles.
- **Session Tokens**: JWT authentication with auto-expiration (1h) and secure Axios interceptors.
- **Credential Safety**: Hashed passwords using 10 salt rounds of `bcryptjs`.
- **Middleware Guards**: Server-side route authorization filters.

### 👥 Employee Profile Directory
- **Extended Profiles**: Tracks designation, salary, date of joining, contact phone, and addresses.
- **Upload Library**: Multi-image employee profile gallery (up to 5 images per employee) managed via `multer`.
- **Competency Registry**: Many-to-Many skills registry tagging professional competencies.

### 🗓️ Leave Management & Approval Engine
- **Multi-Level Workflows**: Requests flow from Employee → Manager Review → HR/Admin Final Clearance.
- **Balance Auto-Deductions**: Approving leaves runs a safe database transaction updating leave status, deducting available days, generating audit trail records, and pushing user notifications.
- **Approval Log**: Complete history logs for every review stage.

### 🕒 Daily Attendance Portal
- **Arrival Windows**: Verifies arrivals against a daily check-in window (e.g. `09:00 AM - 09:30 AM`).
- **Team Registry**: Aggregated registry showing check-in timestamps and status.

### 🔌 IT Asset Management System
- **Hardware Tracking**: Tracks company inventory (Laptops, Monitors, NFC ID Cards) and status (`AVAILABLE`, `ALLOCATED`, `MAINTENANCE`).
- **Safe Transactions**: SQL Transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) execute hardware allocations and returns, logging new values to JSONB and alerting employees.
- **Log Views**: Pre-compiled database views detailing active hardware assignments.

### 📊 Reports & Advanced Analytics
- **Aggregated Summaries**: Dashboard metrics showing total departments, skills, leaves, and inventory counts.
- **CSS SVG Charts**: Custom CSS and SVG indicators displaying department distribution and inventory allocation rates.
- **Postgres Window Functions**: Employs `DENSE_RANK() OVER` query ranking employee absenteeism (total leave days).
- **Monthly Trends**: Aggregates leave request count trends by calendar month.
- **CSV Exporters**: Instant client-side CSV downloads for tables on the Reports dashboard.

---

## 🛠 Tech Stack

### Frontend
- **React.js** 19 - UI view components
- **React Context API** - Centralized user session state
- **Custom React Hooks** - Isolated hooks (`useAuth`, `useLeave`, `useEmployee`)
- **Vite** - High performance bundler
- **React Router** 7 - Single page client routing
- **Axios** - HTTP client with authorization interceptors

### Backend
- **Node.js & Express** - API server framework
- **PostgreSQL** - Relational SQL server
- **pg (node-postgres)** - Non-blocking Postgres driver
- **Joi** - Backend request validator schemas
- **Helmet** - Express header security rules
- **Express Rate Limit** - Brute force protection middleware
- **Multer** - Multipart file upload engine

---

## 📁 Project Structure

```
I-soft-Project/
├── backend/
│   ├── config/
│   │   ├── db.js                    # pg Connection Pool
│   │   └── swagger.js               # Swagger documentation rules
│   ├── controllers/
│   │   ├── assetController.js       # Asset allocations, returns
│   │   ├── attendanceController.js  # Check-in portal logic
│   │   └── leaveController.js       # Leaves requests and approvals
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js                  # Login & Profile endpoints
│   │   ├── employees.js             # Employee CRUD routes
│   │   ├── departments.js           # Departments CRUD routes
│   │   ├── skills.js                # Skills CRUD routes
│   │   ├── leaves.js                # Leaves workflow routes
│   │   └── assets.js                # Hardware inventory routes
│   ├── services/
│   │   ├── assetService.js          # Transactional asset services
│   │   ├── attendanceService.js     # Registry logs checks
│   │   └── leaveService.js          # Leave balances & rank analytics
│   ├── utils/
│   │   └── validation.js            # Joi verification middleware
│   ├── uploads/                     # Uploaded photos catalog
│   ├── index.js                     # Server entry point
│   ├── setup-complete-db.js         # Complete DB rebuild & seed script
│   ├── setup-assets-db.js           # Asset migrations script
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Role route interceptor
│   │   │   ├── Button.jsx           # Styled button component
│   │   │   ├── Card.jsx             # Glassmorphism metric container
│   │   │   ├── Modal.jsx            # Dynamic modal framework
│   │   │   ├── Table.jsx            # Tabular reports renderer
│   │   │   └── Loader.jsx           # Animated page loader
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Session state provider
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Auth context consumer hook
│   │   │   ├── useLeave.js          # Leave api state hook
│   │   │   └── useEmployee.js       # Employee api state hook
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Sign in
│   │   │   ├── Signup.jsx           # Registration
│   │   │   ├── Dashboard.jsx        # Admin / Employee Hub
│   │   │   ├── EmployeeList.jsx     # Directory sheet
│   │   │   ├── AssetManagement.jsx  # Inventory allocations
│   │   │   ├── AttendancePortal.jsx # Clock in panel
│   │   │   ├── LeaveDashboard.jsx   # Staff balance & requests
│   │   │   ├── LeaveApproval.jsx    # Review queue (Admin/HR/Mgr)
│   │   │   ├── Reports.jsx          # Window stats & CSV downloaders
│   │   │   └── Profile.jsx          # Security configs
│   │   ├── services/
│   │   │   └── api.js               # Central Axios client
│   │   ├── App.jsx                  # Main router definitions
│   │   └── index.css                # Global design system & animations
```

---

## 🔧 Installation

### 1. Database Setup
Make sure PostgreSQL is running on your machine. Create a database named `loginapp` or your custom name.

```sql
CREATE DATABASE loginapp;
```

### 2. Environment Variables (.env)
Create a `.env` file in the `/backend` folder:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=loginapp
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=super_secret_key_at_least_32_characters
```

### 3. Backend Setup
From the root workspace directory:

```bash
cd backend
npm install

# Build the complete database schemas, indexes, views, and seed accounts
node setup-complete-db.js

# Start backend server
npm run dev
```

### 4. Frontend Setup
Open another terminal:

```bash
cd frontend
npm install

# Start the Vite local server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 👥 Seeded Accounts

The unified setup script seeds the following sandbox accounts (Password for all: `password123`):
- **Admin**: `admin@company.com`
- **HR**: `hr@company.com`
- **Line Manager**: `manager@company.com`
- **Standard Employee**: `employee@company.com`

---

## 📡 API Documentation

### IT Asset API Endpoints
All routes require authentication via authorization header.

| Method | Endpoint | Clearance | Description |
|--------|----------|-----------|-------------|
| GET | `/api/assets` | ALL | Retrieve hardware list (supports search/filter/pagination) |
| GET | `/api/assets/my-allocations` | ALL | Retrieve assets allocated to active session user |
| POST | `/api/assets` | ADMIN, HR | Create and register new inventory hardware |
| POST | `/api/assets/allocate` | ADMIN, HR | Allocate item to employee (runs safe SQL Transaction) |
| POST | `/api/assets/return` | ADMIN, HR | Mark item returned (runs safe SQL Transaction) |
| GET | `/api/assets/reports` | ADMIN, HR | Fetch asset report records from DB View |

### Advanced Reports API Endpoints
| Method | Endpoint | Clearance | Description |
|--------|----------|-----------|-------------|
| GET | `/api/leaves/admin/advanced-reports` | ADMIN, HR | Get SQL window function ranking list & monthly trends |
| GET | `/api/leaves/admin/reports` | ADMIN, HR | Fetch leaves reports data from VIEW |
| GET | `/api/leaves/admin/statistics` | ADMIN, HR, MGR | Fetch overall leaves stats aggregates |

---

## 🔐 Security Features

- **Joi Validators**: Rigid checks on request bodies in [validation.js](file:///c:/Users/Divyansh/Documents/full%20stack%20intern/backend/utils/validation.js) to avoid injections or garbage values.
- **SQL Parameterization**: Node pg queries use `$1, $2` parameters to secure queries against SQL injection.
- **Database Transactions**: Ensures balance deductions and asset updates revert (`ROLLBACK`) on errors, preventing data splits.
- **Helmet**: Secures HTTP response headers against clickjacking, script execution hijacking, and mime sniffing.
- **Rate Limiter**: Limits requests count on authentication routes to mitigate login brute-forcing.

---

## 📄 License
This project is built as part of an advanced full-stack engineering internship training. All rights reserved.
