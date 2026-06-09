const db = require('./config/db');

const setupAttendanceTable = async () => {
  try {
    console.log('🔧 Updating Attendance Database Structure...\n');

    // 1. Drop existing table if any
    await db.query(`DROP TABLE IF EXISTS attendance CASCADE;`);
    console.log('✅ Old attendance table dropped');

    // 2. Create attendance_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance_settings (
        id INT PRIMARY KEY DEFAULT 1,
        start_time TIME NOT NULL DEFAULT '09:00:00',
        end_time TIME NOT NULL DEFAULT '09:30:00',
        CONSTRAINT check_single_row CHECK (id = 1)
      );
    `);
    console.log('✅ attendance_settings table created');

    // Seed default settings row
    await db.query(`
      INSERT INTO attendance_settings (id, start_time, end_time)
      VALUES (1, '09:00:00', '09:30:00')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Default attendance settings seeded (09:00:00 to 09:30:00)');

    // 3. Create modified attendance table
    await db.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        check_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'PRESENT',
        UNIQUE(user_id, date)
      );
    `);
    console.log('✅ attendance table created (without check-out and hours tracking)');

    // Create indexes for optimization
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    `);
    console.log('✅ Indexes created for optimization');

    console.log('\n✅ Database migration for Attendance complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up attendance table:', error.message);
    process.exit(1);
  }
};

setupAttendanceTable();
