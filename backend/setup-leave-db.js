const db = require('./config/db');

const setupLeaveDatabase = async () => {
  try {
    console.log('🔧 Setting up Leave Management System Database...\n');

    // 1. Create leave_types table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id SERIAL PRIMARY KEY,
        leave_name VARCHAR(100) NOT NULL UNIQUE,
        total_days INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ leave_types table created');

    // 2. Create employee_leave_balance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_leave_balance (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        available_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
        UNIQUE(employee_id, leave_type_id, year)
      );
    `);
    console.log('✅ employee_leave_balance table created');

    // 3. Create leave_applications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_applications (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT
      );
    `);
    console.log('✅ leave_applications table created');

    // 4. Create approval_history table (multi-level approvals)
    await db.query(`
      CREATE TABLE IF NOT EXISTS approval_history (
        id SERIAL PRIMARY KEY,
        leave_id INT NOT NULL,
        approved_by INT NOT NULL,
        approval_level VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leave_id) REFERENCES leave_applications(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE RESTRICT
      );
    `);
    console.log('✅ approval_history table created');

    // 5. Create audit_logs table (transaction tracking)
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        performed_by INT,
        old_values JSONB,
        new_values JSONB,
        status VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES employees(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ audit_logs table created');

    // 6. Create notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50),
        reference_id INT,
        reference_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ notifications table created');

    // 7. Create leave_reports view (for analytics)
    await db.query(`
      CREATE OR REPLACE VIEW leave_reports AS
      SELECT 
        e.id as employee_id,
        e.name as employee_name,
        d.name as department_name,
        lt.leave_name,
        elb.available_days,
        elb.used_days,
        (elb.available_days - elb.used_days) as remaining_days,
        COUNT(CASE WHEN la.status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status = 'REJECTED' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN la.status = 'PENDING' THEN 1 END) as pending_count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_leave_balance elb ON e.id = elb.employee_id
      LEFT JOIN leave_types lt ON elb.leave_type_id = lt.id
      LEFT JOIN leave_applications la ON e.id = la.employee_id 
        AND elb.leave_type_id = la.leave_type_id
      GROUP BY e.id, e.name, d.name, lt.leave_name, elb.available_days, elb.used_days;
    `);
    console.log('✅ leave_reports view created');

    // 8. Insert sample data - Leave Types
    await db.query(`
      INSERT INTO leave_types (leave_name, total_days, description)
      VALUES 
        ('Casual Leave', 12, 'Casual leave for personal reasons'),
        ('Sick Leave', 10, 'Leave for medical reasons'),
        ('Earned Leave', 20, 'Annual leave earned by employees'),
        ('Maternity Leave', 180, 'Leave for pregnant employees'),
        ('Paternity Leave', 15, 'Leave for new fathers')
      ON CONFLICT (leave_name) DO NOTHING;
    `);
    console.log('✅ Sample leave types inserted');

    // 9. Create indexes for better query performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_leave_applications_employee_id 
      ON leave_applications(employee_id);
      
      CREATE INDEX IF NOT EXISTS idx_leave_applications_status 
      ON leave_applications(status);
      
      CREATE INDEX IF NOT EXISTS idx_leave_applications_dates 
      ON leave_applications(from_date, to_date);
      
      CREATE INDEX IF NOT EXISTS idx_approval_history_leave_id 
      ON approval_history(leave_id);
      
      CREATE INDEX IF NOT EXISTS idx_employee_leave_balance_employee_id 
      ON employee_leave_balance(employee_id);
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
      ON notifications(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
      ON audit_logs(entity_type, entity_id);
    `);
    console.log('✅ Indexes created for optimization');

    console.log('\n✅ ✅ ✅ Leave Management Database Setup Complete! ✅ ✅ ✅\n');
    console.log('📊 Tables created:');
    console.log('   1. leave_types');
    console.log('   2. employee_leave_balance');
    console.log('   3. leave_applications');
    console.log('   4. approval_history');
    console.log('   5. audit_logs');
    console.log('   6. notifications');
    console.log('   7. leave_reports (VIEW)');
    console.log('\n🔑 Key Features:');
    console.log('   ✓ Transaction tracking via audit_logs');
    console.log('   ✓ Multi-level approvals');
    console.log('   ✓ Leave balance management');
    console.log('   ✓ Notifications system');
    console.log('   ✓ Analytics view');
    console.log('   ✓ Performance indexes\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
};

// Run setup
setupLeaveDatabase();
