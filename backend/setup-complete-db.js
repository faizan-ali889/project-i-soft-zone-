const db = require('./config/db');
const bcrypt = require('bcryptjs');

const setupCompleteDatabase = async () => {
  try {
    console.log('🔧 Setting up Unified Employee & Leave Management Database...\n');
    console.log('🔧 Dropping existing tables (if any) in correct order...');

    // Drop tables and view in correct order
    await db.query(`
      DROP VIEW IF EXISTS leave_reports CASCADE;
      DROP VIEW IF EXISTS asset_reports CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS approval_history CASCADE;
      DROP TABLE IF EXISTS leave_applications CASCADE;
      DROP TABLE IF EXISTS employee_leave_balance CASCADE;
      DROP TABLE IF EXISTS leave_types CASCADE;
      DROP TABLE IF EXISTS employee_images CASCADE;
      DROP TABLE IF EXISTS employee_skills CASCADE;
      DROP TABLE IF EXISTS skills CASCADE;
      DROP TABLE IF EXISTS asset_allocations CASCADE;
      DROP TABLE IF EXISTS assets CASCADE;
      DROP TABLE IF EXISTS employee_profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
    `);
    console.log('✅ Old tables dropped\n');
    console.log('🔧 Creating tables...');

    // 1. DEPARTMENTS
    await db.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        budget DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: departments');

    // 2. USERS (Unified Credentials & Roles)
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
        reporting_manager_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: users');

    // 3. EMPLOYEE PROFILES (Extended employee details linked to users)
    await db.query(`
      CREATE TABLE employee_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        department_id INT REFERENCES departments(id) ON DELETE SET NULL,
        phone VARCHAR(20),
        address TEXT,
        designation VARCHAR(100),
        salary DECIMAL(12,2),
        date_of_joining DATE DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: employee_profiles');

    // 4. SKILLS
    await db.query(`
      CREATE TABLE skills (
        id SERIAL PRIMARY KEY,
        skill_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: skills');

    // 5. EMPLOYEE SKILLS
    await db.query(`
      CREATE TABLE employee_skills (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        proficiency_level VARCHAR(50) DEFAULT 'Intermediate',
        years_of_experience INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, skill_id)
      );
    `);
    console.log('✅ Created: employee_skills');

    // 6. EMPLOYEE IMAGES
    await db.query(`
      CREATE TABLE employee_images (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: employee_images');

    // 7. LEAVE TYPES
    await db.query(`
      CREATE TABLE leave_types (
        id SERIAL PRIMARY KEY,
        leave_name VARCHAR(100) NOT NULL UNIQUE,
        total_days INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: leave_types');

    // 8. EMPLOYEE LEAVE BALANCE
    await db.query(`
      CREATE TABLE employee_leave_balance (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INT NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
        available_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, leave_type_id, year)
      );
    `);
    console.log('✅ Created: employee_leave_balance');

    // 9. LEAVE APPLICATIONS
    await db.query(`
      CREATE TABLE leave_applications (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INT NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: leave_applications');

    // 10. APPROVAL HISTORY
    await db.query(`
      CREATE TABLE approval_history (
        id SERIAL PRIMARY KEY,
        leave_id INT NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
        approved_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        approval_level VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: approval_history');

    // 11. AUDIT LOGS
    await db.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        performed_by INT REFERENCES users(id) ON DELETE SET NULL,
        old_values JSONB,
        new_values JSONB,
        status VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: audit_logs');

    // 12. NOTIFICATIONS
    await db.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50),
        reference_id INT,
        reference_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );
    `);
    console.log('✅ Created: notifications');

    // 13. ASSETS
    await db.query(`
      CREATE TABLE assets (
        id SERIAL PRIMARY KEY,
        asset_name VARCHAR(100) NOT NULL,
        asset_type VARCHAR(50) NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: assets');

    // 14. ASSET ALLOCATIONS
    await db.query(`
      CREATE TABLE asset_allocations (
        id SERIAL PRIMARY KEY,
        asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        employee_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        allocated_by INT REFERENCES users(id) ON DELETE SET NULL,
        allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        returned_at TIMESTAMP,
        remarks TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'ALLOCATED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created: asset_allocations');

    // Seeding Initial Data
    console.log('\n🌱 Seeding initial data...');

    // Seeding Departments
    const deptRes = await db.query(`
      INSERT INTO departments (department_name, description, budget)
      VALUES 
        ('Engineering', 'Core Development and Technology', 500000),
        ('HR', 'Human Resources', 100000),
        ('Sales', 'Business Development & Marketing', 200000),
        ('Finance', 'Accounts and Treasury', 150000)
      RETURNING id, department_name;
    `);
    const deptMap = {};
    deptRes.rows.forEach(d => {
      deptMap[d.department_name] = d.id;
    });
    console.log('✅ Seeded: Departments');

    // Seeding Skills
    await db.query(`
      INSERT INTO skills (skill_name, description)
      VALUES 
        ('JavaScript', 'Programming language for the Web'),
        ('NodeJS', 'JS runtime environment'),
        ('ReactJS', 'Front-end library'),
        ('PostgreSQL', 'Relational database engine'),
        ('Git', 'Distributed version control')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Seeded: Skills');

    // Seeding Leave Types
    const ltRes = await db.query(`
      INSERT INTO leave_types (leave_name, total_days, description)
      VALUES 
        ('Casual Leave', 12, 'Casual leave for personal reasons'),
        ('Sick Leave', 10, 'Leave for medical reasons'),
        ('Earned Leave', 20, 'Annual leave earned by employees'),
        ('Maternity Leave', 180, 'Leave for pregnant employees'),
        ('Paternity Leave', 15, 'Leave for new fathers')
      RETURNING id, leave_name, total_days;
    `);
    console.log('✅ Seeded: Leave Types');

    // Generate seeded passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Seeding Users
    // 1. Admin
    const adminUser = await db.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin User', 'admin@company.com', $1, 'ADMIN')
      RETURNING id
    `, [hashedPassword]);
    const adminId = adminUser.rows[0].id;

    // 2. HR (Reports to Admin)
    const hrUser = await db.query(`
      INSERT INTO users (name, email, password, role, reporting_manager_id)
      VALUES ('HR Manager', 'hr@company.com', $1, 'HR', $2)
      RETURNING id
    `, [hashedPassword, adminId]);
    const hrId = hrUser.rows[0].id;

    // 3. Line Manager (Reports to HR)
    const managerUser = await db.query(`
      INSERT INTO users (name, email, password, role, reporting_manager_id)
      VALUES ('Line Manager', 'manager@company.com', $1, 'MANAGER', $2)
      RETURNING id
    `, [hashedPassword, hrId]);
    const managerId = managerUser.rows[0].id;

    // 4. Employee (Reports to Manager)
    const employeeUser = await db.query(`
      INSERT INTO users (name, email, password, role, reporting_manager_id)
      VALUES ('Standard Employee', 'employee@company.com', $1, 'EMPLOYEE', $2)
      RETURNING id
    `, [hashedPassword, managerId]);
    const employeeId = employeeUser.rows[0].id;

    console.log('✅ Seeded: Users (Admin, HR, Manager, Employee)');

    // Seeding Employee Profiles
    await db.query(`
      INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary)
      VALUES 
        ($1, $5, '9999999999', 'Admin Suite A10', 'System Administrator', 120000.00),
        ($2, $6, '8888888888', 'HR Desk B21', 'HR Lead', 80000.00),
        ($3, $7, '7777777777', 'Engineering Bay M01', 'Engineering Manager', 110000.00),
        ($4, $7, '6666666666', 'Engineering Desk E12', 'Software Engineer', 60000.00)
    `, [adminId, hrId, managerId, employeeId, deptMap['Engineering'], deptMap['HR'], deptMap['Engineering']]);
    console.log('✅ Seeded: Employee Profiles');

    // Seeding Initial Leave Balances for all users
    for (let uId of [adminId, hrId, managerId, employeeId]) {
      for (let lt of ltRes.rows) {
        await db.query(`
          INSERT INTO employee_leave_balance (employee_id, leave_type_id, available_days, used_days, year)
          VALUES ($1, $2, $3, 0, EXTRACT(YEAR FROM CURRENT_DATE))
        `, [uId, lt.id, lt.total_days]);
      }
    }
    console.log('✅ Seeded: Employee Leave Balances');

    // Seeding Mock Assets
    const sampleAssets = [
      { name: 'MacBook Pro 16"', type: 'Laptop', serial: 'MBP16-987654' },
      { name: 'Dell XPS 15', type: 'Laptop', serial: 'DELL-XPS-342115' },
      { name: 'Lenovo ThinkPad X1', type: 'Laptop', serial: 'LEN-X1-889012' },
      { name: 'MacBook Air M2', type: 'Laptop', serial: 'MBA-M2-554123' },
      { name: 'HP EliteBook 840', type: 'Laptop', serial: 'HP-ELITE-776211' },
      { name: 'Dell UltraSharp 27"', type: 'Monitor', serial: 'MON-DELL-27A' },
      { name: 'LG Ultrawide 34"', type: 'Monitor', serial: 'MON-LG-34UW' },
      { name: 'Samsung Odyssey G7', type: 'Monitor', serial: 'MON-SAM-32G7' },
      { name: 'ASUS ProArt 27"', type: 'Monitor', serial: 'MON-ASUS-27P' },
      { name: 'HP EliteDisplay 24"', type: 'Monitor', serial: 'MON-HP-24ED' },
      { name: 'Employee NFC Access Card v1', type: 'ID Card', serial: 'NFC-ID-1001' },
      { name: 'Employee NFC Access Card v2', type: 'ID Card', serial: 'NFC-ID-1002' },
      { name: 'Employee NFC Access Card v3', type: 'ID Card', serial: 'NFC-ID-1003' },
      { name: 'Employee NFC Access Card v4', type: 'ID Card', serial: 'NFC-ID-1004' },
      { name: 'Employee NFC Access Card v5', type: 'ID Card', serial: 'NFC-ID-1005' },
    ];
    for (const asset of sampleAssets) {
      await db.query(`
        INSERT INTO assets (asset_name, asset_type, serial_number, status)
        VALUES ($1, $2, $3, 'AVAILABLE')
        ON CONFLICT (serial_number) DO NOTHING;
      `, [asset.name, asset.type, asset.serial]);
    }
    console.log('✅ Seeded: Assets');

    // Create Indexes
    await db.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
      CREATE INDEX idx_leave_applications_employee_id ON leave_applications(employee_id);
      CREATE INDEX idx_leave_applications_status ON leave_applications(status);
      CREATE INDEX idx_leave_applications_dates ON leave_applications(from_date, to_date);
      CREATE INDEX idx_approval_history_leave_id ON approval_history(leave_id);
      CREATE INDEX idx_employee_leave_balance_employee_id ON employee_leave_balance(employee_id);
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX idx_assets_type ON assets(asset_type);
      CREATE INDEX idx_assets_status ON assets(status);
      CREATE INDEX idx_asset_allocations_asset_id ON asset_allocations(asset_id);
      CREATE INDEX idx_asset_allocations_employee_id ON asset_allocations(employee_id);
    `);
    console.log('✅ Created: Indexes for performance tuning');

    // 13. Create View: leave_reports
    await db.query(`
      CREATE OR REPLACE VIEW leave_reports AS
      SELECT 
        u.id as employee_id,
        u.name as employee_name,
        d.department_name,
        lt.leave_name,
        elb.available_days,
        elb.used_days,
        (elb.available_days - elb.used_days) as remaining_days,
        COUNT(CASE WHEN la.status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status = 'REJECTED' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN la.status = 'PENDING' THEN 1 END) as pending_count
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      LEFT JOIN employee_leave_balance elb ON u.id = elb.employee_id
      LEFT JOIN leave_types lt ON elb.leave_type_id = lt.id
      LEFT JOIN leave_applications la ON u.id = la.employee_id AND elb.leave_type_id = la.leave_type_id
      GROUP BY u.id, u.name, d.department_name, lt.leave_name, elb.available_days, elb.used_days;
    `);
    console.log('✅ Created: View leave_reports');

    // 14. Create View: asset_reports
    await db.query(`
      CREATE OR REPLACE VIEW asset_reports AS
      SELECT 
        aa.id as allocation_id,
        a.id as asset_id,
        a.asset_name,
        a.asset_type,
        a.serial_number,
        u.id as employee_id,
        u.name as employee_name,
        d.department_name,
        ab.name as allocated_by_name,
        aa.allocated_at,
        aa.returned_at,
        aa.status as allocation_status,
        a.status as asset_status,
        aa.remarks
      FROM asset_allocations aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN users u ON aa.employee_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      LEFT JOIN users ab ON aa.allocated_by = ab.id;
    `);
    console.log('✅ Created: View asset_reports');

    console.log('\n🎉 Unified Database Setup Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
};

setupCompleteDatabase();
