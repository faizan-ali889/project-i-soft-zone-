const db = require('./config/db');

async function dumpData() {
  try {
    const users = await db.query("SELECT id, name, email FROM users");
    console.log("USERS:", users.rows);
    
    const employees = await db.query("SELECT id, name, email, role FROM employees");
    console.log("EMPLOYEES:", employees.rows);
    
    const profiles = await db.query("SELECT * FROM employee_profiles");
    console.log("EMPLOYEE_PROFILES:", profiles.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

dumpData();
