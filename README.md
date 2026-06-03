# 🚀 Employee Profile Management System

A full-stack web application for managing employee profiles with image uploads, skill assignments, and department management. Built with **React**, **Node.js/Express**, and **PostgreSQL**.

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Database Relationships](#database-relationships)
- [Deployment](#deployment)

---

## ✨ Features

### Authentication & Authorization
- ✅ User Registration & Login with JWT Authentication
- ✅ Protected Routes & Middleware
- ✅ Secure Password Hashing with bcryptjs
- ✅ Token-based Session Management

### Employee Management
- ✅ Create Employee Profile
- ✅ Edit/Update Employee Details
- ✅ Delete Employee Records
- ✅ View All Employees in Table Format
- ✅ Employee Search & Filtering

### Department Management
- ✅ Create, Read, Update, Delete Departments
- ✅ Assign Employees to Departments
- ✅ Department Statistics

### Skills Management
- ✅ Manage Skills Database
- ✅ Multi-select Skills Assignment
- ✅ Employee Skill Tracking
- ✅ Many-to-Many Relationship

### Image Management
- ✅ Upload Multiple Images (up to 5 per employee)
- ✅ Store Images in Backend Directory
- ✅ Image URL Tracking in Database
- ✅ Supported Formats: JPG, PNG, GIF, WEBP

### Dashboard & Analytics
- ✅ Statistics Cards (Employees, Departments, Skills, Images)
- ✅ Quick Navigation Buttons
- ✅ Real-time Data Updates
- ✅ User Profile Display

### Advanced Features
- ✅ SQL JOIN Queries for Complex Data Retrieval
- ✅ One-to-Many Relationships (Employee → Images)
- ✅ Many-to-Many Relationships (Employee ↔ Skills)
- ✅ CORS Configuration
- ✅ Error Handling & Validation

---

## 🛠 Tech Stack

### Frontend
- **React** 19.2.6 - UI Library
- **Vite** 8.0.12 - Build Tool
- **React Router** 7.16.0 - Routing
- **Axios** 1.16.1 - HTTP Client

### Backend
- **Node.js** - Runtime Environment
- **Express** 5.2.1 - Web Framework
- **PostgreSQL** - Database
- **pg** 8.21.0 - Database Driver
- **JWT** (jsonwebtoken 9.0.3) - Authentication
- **bcryptjs** 2.4.3 - Password Hashing
- **Multer** - File Upload Handling
- **CORS** 2.8.6 - Cross-Origin Support

### Development Tools
- **Nodemon** 3.1.14 - Auto-reload
- **dotenv** 17.4.2 - Environment Variables

---

## 📁 Project Structure

```
full-stack-intern/
├── backend/
│   ├── config/
│   │   └── db.js                    # Database Connection
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT Verification
│   ├── routes/
│   │   ├── auth.js                  # Authentication APIs
│   │   ├── departments.js           # Department CRUD
│   │   ├── skills.js                # Skills CRUD
│   │   └── employees.js             # Employee CRUD + Image Upload
│   ├── uploads/                     # Uploaded Images Directory
│   ├── index.js                     # Main Server File
│   ├── setup-db.js                  # Database Initialization
│   ├── package.json
│   ├── .env                         # Environment Variables
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Route Protection
│   │   │   └── StatisticsCard.jsx   # Reusable Card
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login Page
│   │   │   ├── Signup.jsx           # Registration Page
│   │   │   ├── Dashboard.jsx        # Main Dashboard
│   │   │   ├── EmployeeList.jsx     # Employee Table
│   │   │   ├── CreateEmployee.jsx   # Create Form
│   │   │   ├── EditEmployee.jsx     # Edit Form
│   │   │   ├── DepartmentMaster.jsx # Department Management
│   │   │   ├── SkillsMaster.jsx     # Skills Management
│   │   │   └── Profile.jsx          # User Profile
│   │   ├── services/
│   │   │   └── api.js               # API Service Layer
│   │   ├── App.jsx                  # Main App Component
│   │   ├── main.jsx                 # Entry Point
│   │   └── index.css
│   ├── public/
│   ├── vite.config.js
│   ├── package.json
│   ├── eslint.config.js
│   └── .gitignore
│
├── SETUP_GUIDE.md
├── QUICKSTART.md
├── CODE_FIXES.md
├── CHECKLIST.md
├── SUMMARY.md
└── README.md
```

---

## 🔧 Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

```bash
# Clone repository
git clone https://github.com/divyansh0690/I-soft-Project.git
cd I-soft-Project/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fullstack_intern_db
DB_PASSWORD=your_password_here
DB_PORT=5432
JWT_SECRET=your_secret_key_min_32_chars_here
NODE_ENV=development
EOF

# Initialize database
npm run setup-db

# Start backend server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🗄 Database Setup

### Create PostgreSQL Database

```sql
createdb fullstack_intern_db
```

### Database Tables

The application automatically creates the following tables:

1. **users** - User accounts with JWT authentication
2. **departments** - Company departments
3. **employee_profiles** - Employee information with FK to users & departments
4. **employee_images** - One-to-Many relationship with employee_profiles
5. **skills** - Available skills in the system
6. **employee_skills** - Many-to-Many junction table

### Sample Data

```sql
-- Departments
INSERT INTO departments(department_name) VALUES ('IT'), ('HR'), ('Finance'), ('Marketing');

-- Skills
INSERT INTO skills(skill_name) VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java');
```

---

## 🚀 Running the Application

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Terminal 3 - Database (Optional)
```bash
psql -U postgres -d fullstack_intern_db
```

---

## 📡 API Documentation

### Authentication APIs

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user & get token |
| GET | `/api/auth/user-profile` | Yes | Get current user info |

### Department APIs

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/departments` | No | Get all departments |
| POST | `/api/departments` | Yes | Create department |
| PUT | `/api/departments/:id` | Yes | Update department |
| DELETE | `/api/departments/:id` | Yes | Delete department |

### Skills APIs

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/skills` | No | Get all skills |
| POST | `/api/skills` | Yes | Create skill |
| PUT | `/api/skills/:id` | Yes | Update skill |
| DELETE | `/api/skills/:id` | Yes | Delete skill |

### Employee APIs

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/employees` | No | Get all employees (with JOINs) |
| GET | `/api/employees/:id` | No | Get employee details |
| POST | `/api/employees` | Yes | Create employee |
| PUT | `/api/employees/:id` | Yes | Update employee |
| DELETE | `/api/employees/:id` | Yes | Delete employee |
| POST | `/api/employees/:id/upload` | Yes | Upload images |

---

## 💻 Usage Guide

### 1. Register & Login
```
1. Go to http://localhost:5173
2. Click "Register" 
3. Enter Name, Email, Password
4. Login with credentials
```

### 2. Create Employee
```
1. Click "Add Employee" on Dashboard
2. Select Department
3. Enter Phone, Address, Designation, Salary
4. Select Multiple Skills
5. Upload up to 5 Images
6. Click "Create Employee"
```

### 3. Manage Employees
```
1. Go to "Employees" page
2. View all employees in table
3. Click "Edit" to modify employee
4. Click "Delete" to remove employee
```

### 4. Manage Departments
```
1. Go to "Departments" page
2. Add new department
3. Edit existing department
4. Delete department (if not in use)
```

### 5. Manage Skills
```
1. Go to "Skills" page
2. Add new skill
3. Edit skill name
4. Delete skill
```

---

## 🔗 Database Relationships

### One-to-Many Relationship
```
Employee Profile → Multiple Images
- One employee can have multiple images
- Images are deleted when employee is deleted
```

### Many-to-Many Relationship
```
Employee Profile ↔ Skills
- One employee can have multiple skills
- One skill can be assigned to multiple employees
- Managed through employee_skills junction table
```

### SQL JOIN Examples

**Get Employee with Department:**
```sql
SELECT u.name, d.department_name
FROM employee_profiles ep
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN departments d ON ep.department_id = d.id;
```

**Get Employee with Skills:**
```sql
SELECT u.name, s.skill_name
FROM employee_skills es
INNER JOIN employee_profiles ep ON es.employee_id = ep.id
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN skills s ON es.skill_id = s.id;
```

---

## 🌐 Deployment

### Backend Deployment (Render.com)

1. Push code to GitHub
2. Go to [Render Dashboard](https://render.com)
3. Click "New Web Service"
4. Connect GitHub repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment Variables:**
     ```
     DATABASE_URL=postgresql://user:password@host/db
     JWT_SECRET=your_secret_key
     ```

### Database Deployment (Neon PostgreSQL)

1. Go to [Neon.tech](https://neon.tech)
2. Create PostgreSQL database
3. Copy connection string
4. Add to DATABASE_URL in Render

### Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com)
2. Import GitHub repository
3. Select `frontend` folder
4. Click Deploy
5. Frontend runs on `yourdomain.vercel.app`

---

## 🔐 Security Features

✅ **Password Hashing** - bcryptjs with salt rounds
✅ **JWT Authentication** - Token-based auth
✅ **Protected Routes** - Frontend route protection
✅ **Middleware Protection** - Backend route protection
✅ **CORS Configuration** - Restricted origins
✅ **Input Validation** - Form validation on both ends
✅ **Error Handling** - Comprehensive error messages
✅ **Environment Variables** - Sensitive data protection

---

## 📊 Learning Outcomes

Students will learn:

- ✅ **Full-Stack Development** - Frontend to Backend Integration
- ✅ **Authentication** - JWT, Password Hashing, Protected Routes
- ✅ **Database Design** - Relationships, Foreign Keys, Constraints
- ✅ **SQL Queries** - INNER JOINs, Complex Queries
- ✅ **RESTful APIs** - Design and Implementation
- ✅ **File Upload** - Multer Configuration, File Management
- ✅ **React Hooks** - useState, useEffect, useNavigate
- ✅ **Error Handling** - Try-Catch, Error Messages
- ✅ **State Management** - Component State
- ✅ **API Integration** - Axios, Interceptors

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fullstack_intern_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_secret_key_min_32_chars
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### "Connection Refused" Error
```
Solution: Ensure PostgreSQL is running
psql -U postgres (test connection)
```

### "User Already Exists" Error
```
Solution: Use different email for registration
```

### "Token Invalid" Error
```
Solution: Clear localStorage and login again
localStorage.clear()
```

### Image Upload Not Working
```
Solution: Check backend/uploads/ folder exists
mkdir -p backend/uploads
```

### CORS Error
```
Solution: Backend CORS is configured for localhost:5173
Ensure frontend is running on correct port
```

---

## 📞 Support & Contact

For issues or questions:
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Check [QUICKSTART.md](./QUICKSTART.md)
- Check [CODE_FIXES.md](./CODE_FIXES.md)

---

## 📄 License

This project is part of an internship training program. All rights reserved.

---

## 👨‍💻 Author

**Divyansh Singh**
- GitHub: [@divyansh0690](https://github.com/divyansh0690)
- Project: Employee Profile Management System

---

## 🎯 Version

**Version:** 1.0.0  
**Last Updated:** June 2026

---

## ⭐ Features Coming Soon

- [ ] Employee Performance Ratings
- [ ] Department Analytics
- [ ] Salary History Tracking
- [ ] Advanced Filtering & Search
- [ ] Email Notifications
- [ ] Role-based Access Control (RBAC)
- [ ] Audit Logs
- [ ] Export to PDF/Excel

---

<div align="center">

### Made with ❤️ for Learning

**⭐ If you found this helpful, please give it a star!**

</div>
"# I-soft-Project" 
"# I-soft-Project" 
