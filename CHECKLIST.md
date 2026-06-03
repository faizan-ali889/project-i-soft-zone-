# Pre-Launch Checklist

## Environment Setup ✓

- [ ] PostgreSQL installed and running
- [ ] Node.js installed (version 14+)
- [ ] `backend/.env` file created with your credentials:
  ```
  DB_USER=postgres
  DB_HOST=localhost
  DB_NAME=fullstack_intern_db
  DB_PASSWORD=<your_password>
  DB_PORT=5432
  JWT_SECRET=<your_secret_key_32_chars_min>
  ```

## Backend Setup ✓

- [ ] Navigate to backend folder: `cd backend`
- [ ] Install dependencies: `npm install`
- [ ] Create database tables: `npm run setup-db`
- [ ] Verify no error messages
- [ ] Start server: `npm run dev`
- [ ] Should see: "Server running on port 5000"
- [ ] Should see: "Listening on port 5000" or similar

## Frontend Setup ✓

- [ ] Navigate to frontend folder: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Should see: "VITE v*.*.* ready in *.** ms"
- [ ] Should see: "Local: http://localhost:5173/"

## Database Verification ✓

- [ ] Connect to database: `psql -U postgres -d fullstack_intern_db`
- [ ] List tables: `\dt`
- [ ] Should see "users" table
- [ ] View table structure: `\d users`
- [ ] Exit: `\q`

## API Endpoints Testing ✓

### Register Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```
Expected: `{"message":"User registered successfully!"}`

### Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```
Expected: `{"token":"...","message":"Login Success"}`

### User Profile Endpoint
```bash
curl -X GET http://localhost:5000/api/auth/user-profile \
  -H "Authorization: <your_token_from_login>"
```
Expected: `{"user":{"id":1,"name":"John Doe","email":"john@example.com"}}`

## Frontend UI Testing ✓

1. **Home Page**
   - [ ] Opens at http://localhost:5173
   - [ ] Redirects to /login
   - [ ] Login page displays

2. **Sign Up Page**
   - [ ] Go to http://localhost:5173/signup
   - [ ] Fill in form: Name, Email, Password
   - [ ] Click Register button
   - [ ] No errors in browser console
   - [ ] Redirected to login page

3. **Login Page**
   - [ ] Go to http://localhost:5173/login
   - [ ] Enter registered email and password
   - [ ] Click Log In button
   - [ ] Should redirect to /dashboard
   - [ ] No errors in browser console

4. **Dashboard Page**
   - [ ] Shows user's name
   - [ ] Shows user's email
   - [ ] Logout button displays
   - [ ] User info loads correctly

5. **Logout**
   - [ ] Click "Logout (End Session)" button
   - [ ] Redirected to login page
   - [ ] Manually accessing /dashboard redirects to login

## Browser Console Check ✓

- [ ] No red errors when loading login page
- [ ] No red errors when registering
- [ ] No red errors when logging in
- [ ] No red errors on dashboard
- [ ] Network tab shows successful API calls (200/201 status)

## Common Issues & Fixes ✓

**Issue**: "Connection refused" error
- [ ] Verify PostgreSQL is running
- [ ] Check .env credentials are correct
- [ ] Restart backend server

**Issue**: "User not found"
- [ ] Verify user was registered correctly
- [ ] Check database: `SELECT * FROM users;`

**Issue**: "Invalid token" error
- [ ] Clear browser localStorage
- [ ] Log in again to get fresh token
- [ ] Check JWT_SECRET in .env

**Issue**: CORS errors
- [ ] Backend CORS already configured for localhost:5173
- [ ] Check frontend is running on correct port

**Issue**: "Cannot find module" errors
- [ ] Run `npm install` in that folder
- [ ] Check for typos in require/import paths

## Performance Check ✓

- [ ] Login happens within 2-3 seconds
- [ ] Dashboard loads within 1-2 seconds
- [ ] No network errors in browser DevTools
- [ ] No duplicate API calls

## Security Check ✓

- [ ] .env file is in .gitignore ✓
- [ ] Passwords are hashed in database (not plaintext)
- [ ] JWT token is valid in localStorage
- [ ] Token is sent with Authorization header
- [ ] Dashboard requires login (can't access without token)

## Success Indicators ✓

If you see all of these, your setup is **100% working**:

✅ Backend server running on port 5000
✅ Frontend dev server running on port 5173
✅ PostgreSQL database connected
✅ `users` table created in database
✅ Can register a new account
✅ Can log in with registered credentials
✅ Can see user info on dashboard
✅ Can logout and return to login
✅ Protected route prevents unauthorized access
✅ No console errors

---

## Final Verification

Run this test sequence:

1. Open http://localhost:5173
2. Click "Register"
3. Fill form with test data
4. Submit and verify redirect to login
5. Click "Log In"
6. Enter test credentials
7. Verify dashboard shows your info
8. Click "Logout"
9. Verify redirect to login
10. Try accessing http://localhost:5173/dashboard
11. Verify redirect back to login

**If all steps pass, your app is fully functional! 🎉**
