const db = require('./config/db');
const bcrypt = require('bcryptjs');

const employeesData = [
  {
    name: 'Alice Smith',
    email: 'alice.smith@company.com',
    phone: '9876543210',
    address: '123 Maple St, Tech City',
    designation: 'Software Engineer',
    salary: 75000.00,
    departmentName: 'Engineering',
    managerEmail: 'manager@company.com',
    leaves: [
      {
        leaveTypeName: 'Casual Leave',
        fromDate: '2026-06-15',
        toDate: '2026-06-18',
        reason: 'Family wedding attendance and travel.'
      }
    ]
  },
  {
    name: 'Bob Jones',
    email: 'bob.jones@company.com',
    phone: '9876543211',
    address: '456 Oak Avenue, Tech City',
    designation: 'QA Automation Engineer',
    salary: 62000.00,
    departmentName: 'Engineering',
    managerEmail: 'manager@company.com',
    leaves: [
      {
        leaveTypeName: 'Sick Leave',
        fromDate: '2026-06-08',
        toDate: '2026-06-09',
        reason: 'Dental surgery and post-op rest.'
      }
    ]
  },
  {
    name: 'Charlie Brown',
    email: 'charlie.brown@company.com',
    phone: '9876543212',
    address: '789 Pine Rd, Metro City',
    designation: 'HR Specialist',
    salary: 55000.00,
    departmentName: 'HR',
    managerEmail: 'hr@company.com',
    leaves: [
      {
        leaveTypeName: 'Casual Leave',
        fromDate: '2026-07-02',
        toDate: '2026-07-03',
        reason: 'Moving to a new apartment.'
      }
    ]
  },
  {
    name: 'David Miller',
    email: 'david.miller@company.com',
    phone: '9876543213',
    address: '321 Elm St, Metro City',
    designation: 'Senior Accountant',
    salary: 70000.00,
    departmentName: 'Finance',
    managerEmail: 'hr@company.com',
    leaves: []
  },
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    phone: '9876543214',
    address: '654 Birch Lane, Sales Town',
    designation: 'Sales Executive',
    salary: 50000.00,
    departmentName: 'Sales',
    managerEmail: 'manager@company.com',
    leaves: [
      {
        leaveTypeName: 'Earned Leave',
        fromDate: '2026-08-10',
        toDate: '2026-08-14',
        reason: 'Annual summer vacation with family.'
      }
    ]
  },
  {
    name: 'Frank Taylor',
    email: 'frank.taylor@company.com',
    phone: '9876543215',
    address: '987 Cedar Way, Tech City',
    designation: 'DevOps Engineer',
    salary: 80000.00,
    departmentName: 'Engineering',
    managerEmail: 'manager@company.com',
    leaves: []
  },
  {
    name: 'Grace Davies',
    email: 'grace.davies@company.com',
    phone: '9876543216',
    address: '159 Walnut Dr, Metro City',
    designation: 'Talent Acquisition Partner',
    salary: 58000.00,
    departmentName: 'HR',
    managerEmail: 'hr@company.com',
    leaves: []
  },
  {
    name: 'Henry Evans',
    email: 'henry.evans@company.com',
    phone: '9876543217',
    address: '753 Chestnut Court, Capital City',
    designation: 'Financial Analyst',
    salary: 68000.00,
    departmentName: 'Finance',
    managerEmail: 'hr@company.com',
    leaves: []
  },
  {
    name: 'Isabella Thomas',
    email: 'isabella.thomas@company.com',
    phone: '9876543218',
    address: '852 Willow Lane, Sales Town',
    designation: 'Sales Manager',
    salary: 85000.00,
    departmentName: 'Sales',
    managerEmail: 'admin@company.com',
    leaves: []
  },
  {
    name: 'Jack Roberts',
    email: 'jack.roberts@company.com',
    phone: '9876543219',
    address: '456 Alder St, Tech City',
    designation: 'Frontend Developer',
    salary: 60000.00,
    departmentName: 'Engineering',
    managerEmail: 'manager@company.com',
    leaves: []
  }
];

async function seed() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding 10 realistic employees...');

    // 1. Get departments mapping
    const deptRes = await client.query('SELECT id, department_name FROM departments');
    const deptMap = {};
    deptRes.rows.forEach(r => {
      deptMap[r.department_name] = r.id;
    });

    // 2. Get users mapping (for managers)
    const userRes = await client.query('SELECT id, email FROM users');
    const managerMap = {};
    userRes.rows.forEach(r => {
      managerMap[r.email] = r.id;
    });

    // 3. Get leave types mapping
    const ltRes = await client.query('SELECT id, leave_name, total_days FROM leave_types');
    const ltMap = {};
    ltRes.rows.forEach(r => {
      ltMap[r.leave_name] = { id: r.id, totalDays: r.total_days };
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    for (const emp of employeesData) {
      console.log(`Processing ${emp.name}...`);
      
      // Check if user already exists
      const existRes = await client.query('SELECT id FROM users WHERE email = $1', [emp.email]);
      let uId;
      if (existRes.rows.length > 0) {
        uId = existRes.rows[0].id;
        console.log(`- User already exists with ID ${uId}`);
      } else {
        // Insert user
        const managerId = managerMap[emp.managerEmail] || null;
        const userInsert = await client.query(
          `INSERT INTO users (name, email, password, role, reporting_manager_id)
           VALUES ($1, $2, $3, 'EMPLOYEE', $4) RETURNING id`,
          [emp.name, emp.email, hashedPassword, managerId]
        );
        uId = userInsert.rows[0].id;
        console.log(`- Created user ID ${uId}`);
      }

      // Check if profile exists
      const profileExist = await client.query('SELECT id FROM employee_profiles WHERE user_id = $1', [uId]);
      let profileId;
      const deptId = deptMap[emp.departmentName] || null;
      if (profileExist.rows.length > 0) {
        profileId = profileExist.rows[0].id;
        console.log(`- Profile already exists with ID ${profileId}`);
      } else {
        // Insert profile
        const profileInsert = await client.query(
          `INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [uId, deptId, emp.phone, emp.address, emp.designation, emp.salary]
        );
        profileId = profileInsert.rows[0].id;
        console.log(`- Created profile ID ${profileId}`);
      }

      // Initialize leave balances
      for (const ltName of Object.keys(ltMap)) {
        await client.query(
          `INSERT INTO employee_leave_balance (employee_id, leave_type_id, available_days, used_days, year)
           VALUES ($1, $2, $3, 0, EXTRACT(YEAR FROM CURRENT_DATE))
           ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
          [uId, ltMap[ltName].id, ltMap[ltName].totalDays]
        );
      }
      console.log(`- Leave balances initialized`);

      // Submit leave requests if specified
      if (emp.leaves && emp.leaves.length > 0) {
        for (const leave of emp.leaves) {
          const ltInfo = ltMap[leave.leaveTypeName];
          if (!ltInfo) continue;

          // Calculate total days
          const from = new Date(leave.fromDate);
          const to = new Date(leave.toDate);
          const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

          // Check if application already exists
          const appExist = await client.query(
            `SELECT id FROM leave_applications 
             WHERE employee_id = $1 AND from_date = $2 AND to_date = $3`,
            [uId, leave.fromDate, leave.toDate]
          );

          if (appExist.rows.length > 0) {
            console.log(`- Leave application already exists`);
          } else {
            const leaveInsert = await client.query(
              `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING id`,
              [uId, ltInfo.id, leave.fromDate, leave.toDate, totalDays, leave.reason]
            );
            const leaveId = leaveInsert.rows[0].id;
            console.log(`- Created pending leave request ID ${leaveId} (${totalDays} days)`);

            // Log to audit log
            await client.query(
              `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, old_values, new_values, status)
               VALUES ('LEAVE_APPLICATION_CREATED', 'leave_application', $1, $2, null, $3, 'SUCCESS')`,
              [leaveId, uId, JSON.stringify(leaveInsert.rows[0])]
            );

            // Create notification for manager
            const managerId = managerMap[emp.managerEmail] || null;
            if (managerId) {
              await client.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
                 VALUES ($1, 'New Leave Request', $2, 'LEAVE_REQUEST', $3, 'leave_application')`,
                [managerId, `${emp.name} has requested ${totalDays} days of leave`, leaveId]
              );
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ 10 Employees seeded successfully with profiles, leave balances, and sample pending leave requests!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding employees:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
