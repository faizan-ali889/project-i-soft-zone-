# Full Stack App Setup & Connection Guide

## Project Overview
This is a full-stack authentication application with:
- **Frontend**: React with Vite (runs on `http://localhost:5173`)
- **Backend**: Node.js/Express (runs on `http://localhost:5000`)
- **Database**: PostgreSQL

## Prerequisites
- Node.js installed
- PostgreSQL installed and running
- npm or yarn installed

## Setup Instructions

### 1. Database Setup

#### Step 1: Create PostgreSQL Database
```bash
# Open PostgreSQL command line
psql -U postgres

# Create the database
CREATE DATABASE fullstack_intern_db;

# Exit psql
\q
```

#### Step 2: Create Users Table (Backend)
Navigate to the backend folder and run:
```bash
cd backend
npm install
npm run setup-db
```

This creates the `users` table automatically.

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your PostgreSQL credentials:
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=fullstack_intern_db
# DB_PASSWORD=your_db_password
# DB_PORT=5432
# JWT_SECRET=your_secret_key_min_32_chars

# Start the backend server
npm run dev
```

Backend will run on: `http://localhost:5000`

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## How to Use

1. **Sign Up**: Go to `http://localhost:5173/signup` and create an account
2. **Log In**: Go to `http://localhost:5173/login` and log in with your credentials
3. **Dashboard**: After login, you'll see your user profile with name and email
4. **Log Out**: Click the logout button to end your session

## Architecture

### Authentication Flow
1. User submits email & password
2. Backend validates credentials against PostgreSQL
3. Password is compared using bcrypt hashing
4. JWT token is generated and sent to frontend
5. Token is stored in localStorage
6. Protected routes check for token before allowing access
7. Dashboard fetches user profile using the token

### API Endpoints

**POST /api/auth/register**
- Create a new user account
- Body: `{ name, email, password }`

**POST /api/auth/login**
- Log in and receive JWT token
- Body: `{ email, password }`
- Returns: `{ token, message }`

**GET /api/auth/user-profile** (Protected)
- Get current user's profile
- Requires: Authorization header with token
- Returns: `{ user: { id, name, email } }`

## File Structure Changes Made

```
backend/
├── .env                      # Environment variables
├── .env.example              # Example env file
├── setup-db.js              # Database initialization script
├── config/
│   └── db.js                # Database connection
├── routes/
│   └── auth.js              # Auth routes (UPDATED)
└── middleware/
    └── authMiddleware.js    # JWT verification

frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Protected route wrapper (NEW)
│   ├── services/
│   │   └── api.js                # API service layer (NEW)
│   ├── pages/
│   │   ├── Login.jsx            # Login page (UPDATED)
│   │   ├── Signup.jsx           # Sign up page (UPDATED)
│   │   └── Dashboard.jsx        # Dashboard (UPDATED)
│   └── App.jsx                  # App router (UPDATED)
```

## Key Improvements Made

✅ Fixed import paths in backend
✅ Added missing user-profile route
✅ Created database schema and setup script
✅ Added environment variable support
✅ Created API service layer for cleaner code
✅ Added ProtectedRoute component
✅ Improved error handling
✅ Better loading states
✅ Replaced window.location with React Router navigation
✅ Added proper JWT token handling with interceptors

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check database credentials in .env file
- Verify database name matches

### "User not found" error
- Make sure the database table exists (run `npm run setup-db`)
- Check that you're using the correct email

### "Invalid token" error
- Refresh the page (token might have expired)
- Log in again to get a new token
- Clear localStorage and try again

### Frontend not connecting to backend
- Check that backend is running on port 5000
- Verify CORS is enabled in backend
- Check browser console for specific errors

## Environment Variables (.env)

```
DB_USER=postgres                           # PostgreSQL username
DB_HOST=localhost                          # Database host
DB_NAME=fullstack_intern_db               # Database name
DB_PASSWORD=your_password_here            # PostgreSQL password
DB_PORT=5432                              # PostgreSQL port
JWT_SECRET=your_jwt_secret_key_min_32_chars  # JWT signing secret
NODE_ENV=development                       # Environment mode
```

## Security Notes

⚠️ Never commit `.env` file to version control
⚠️ JWT_SECRET should be at least 32 characters long in production
⚠️ Passwords are hashed using bcrypt before storing
⚠️ Tokens expire after 1 hour
⚠️ Always use HTTPS in production

---

**All systems are now properly configured and connected!**
