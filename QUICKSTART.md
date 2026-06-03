# Quick Start Guide

## One-Time Setup

### 1. Update Backend Environment Variables
Edit `backend/.env` with your PostgreSQL credentials:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fullstack_intern_db
DB_PASSWORD=<your_postgres_password>
DB_PORT=5432
JWT_SECRET=super_secret_key_at_least_32_characters_long
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
npm run setup-db
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## Running the Application

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
# Backend running on http://localhost:5000
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

### Terminal 3 - Optionally: Database Access
```bash
psql -U postgres -d fullstack_intern_db
```

---

## Testing the Application

1. Open browser to `http://localhost:5173`
2. Click "Register" to create an account
3. Fill in Name, Email, Password
4. You'll be redirected to Login page
5. Log in with your credentials
6. You should see your Dashboard with your name and email
7. Click Logout to return to login

---

## Database Commands

### View all users
```sql
SELECT * FROM users;
```

### Delete all users (reset)
```sql
TRUNCATE TABLE users RESTART IDENTITY;
```

### View table structure
```sql
\d users
```

---

## Useful Commands

**Backend:**
- `npm run dev` - Start dev server with auto-reload
- `npm run setup-db` - Create database tables

**Frontend:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Check code quality

---

## API Endpoints Reference

| Method | Endpoint | Protected | Purpose |
|--------|----------|-----------|---------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user, get token |
| GET | /api/auth/user-profile | Yes | Get current user's info |

**Protected endpoints require**: `Authorization: <token>` header
