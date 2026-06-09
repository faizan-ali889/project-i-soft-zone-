const db = require('./config/db');

const setupAssetsDatabase = async () => {
  try {
    console.log('🔧 Setting up Asset Management Database tables and views...\n');

    // 1. Create assets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        asset_name VARCHAR(100) NOT NULL,
        asset_type VARCHAR(50) NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ assets table created');

    // 2. Create asset_allocations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS asset_allocations (
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
    console.log('✅ asset_allocations table created');

    // 3. Create indexes for performance tuning
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_asset_allocations_asset_id ON asset_allocations(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_allocations_employee_id ON asset_allocations(employee_id);
      CREATE INDEX IF NOT EXISTS idx_asset_allocations_status ON asset_allocations(status);
    `);
    console.log('✅ Asset indexes created');

    // 4. Create database view: asset_reports
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
    console.log('✅ asset_reports view created');

    // 5. Seed initial mock assets
    const sampleAssets = [
      // Laptops
      { name: 'MacBook Pro 16"', type: 'Laptop', serial: 'MBP16-987654' },
      { name: 'Dell XPS 15', type: 'Laptop', serial: 'DELL-XPS-342115' },
      { name: 'Lenovo ThinkPad X1', type: 'Laptop', serial: 'LEN-X1-889012' },
      { name: 'MacBook Air M2', type: 'Laptop', serial: 'MBA-M2-554123' },
      { name: 'HP EliteBook 840', type: 'Laptop', serial: 'HP-ELITE-776211' },
      // Monitors
      { name: 'Dell UltraSharp 27"', type: 'Monitor', serial: 'MON-DELL-27A' },
      { name: 'LG Ultrawide 34"', type: 'Monitor', serial: 'MON-LG-34UW' },
      { name: 'Samsung Odyssey G7', type: 'Monitor', serial: 'MON-SAM-32G7' },
      { name: 'ASUS ProArt 27"', type: 'Monitor', serial: 'MON-ASUS-27P' },
      { name: 'HP EliteDisplay 24"', type: 'Monitor', serial: 'MON-HP-24ED' },
      // ID Cards
      { name: 'Employee NFC Access Card v1', type: 'ID Card', serial: 'NFC-ID-1001' },
      { name: 'Employee NFC Access Card v2', type: 'ID Card', serial: 'NFC-ID-1002' },
      { name: 'Employee NFC Access Card v3', type: 'ID Card', serial: 'NFC-ID-1003' },
      { name: 'Employee NFC Access Card v4', type: 'ID Card', serial: 'NFC-ID-1004' },
      { name: 'Employee NFC Access Card v5', type: 'ID Card', serial: 'NFC-ID-1005' },
    ];

    console.log('🌱 Seeding initial assets...');
    for (const asset of sampleAssets) {
      await db.query(`
        INSERT INTO assets (asset_name, asset_type, serial_number, status)
        VALUES ($1, $2, $3, 'AVAILABLE')
        ON CONFLICT (serial_number) DO NOTHING;
      `, [asset.name, asset.type, asset.serial]);
    }
    console.log('✅ Seeded assets');

    console.log('\n✅ ✅ ✅ Asset Database Setup Complete! ✅ ✅ ✅\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up assets database:', error.message);
    process.exit(1);
  }
};

setupAssetsDatabase();
