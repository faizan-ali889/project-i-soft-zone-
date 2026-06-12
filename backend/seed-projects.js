const db = require('./config/db');

async function seedProjects() {
  console.log('🌱 Starting Projects & Roster Seeding...');
  
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Clear existing team data
    console.log('🧹 Clearing old team data...');
    await client.query('TRUNCATE TABLE teams CASCADE');
    console.log('✅ Old teams, members, and tasks cleared.');

    // 2. Fetch all users to map emails to IDs dynamically
    const userRes = await client.query('SELECT id, name, email FROM users');
    const userMap = {};
    userRes.rows.forEach(u => {
      userMap[u.email] = u.id;
    });

    // Verify critical leads exist
    const getUserId = (email) => {
      const id = userMap[email];
      if (!id) {
        throw new Error(`Critical user not found in database: ${email}. Please run seed-employees.js first.`);
      }
      return id;
    };

    console.log('🚀 Seeding 4 Realistic Projects (Teams)...');

    // --- PROJECT 1: Core Platform API ---
    const t1Res = await client.query(
      `INSERT INTO teams (team_name, description, team_lead_id, deadline, status)
       VALUES ('Core Platform API', 'Core API Services and Endpoint optimization', $1, CURRENT_DATE + 30, 'ACTIVE')
       RETURNING id`,
      [getUserId('manager@company.com')]
    );
    const t1Id = t1Res.rows[0].id;

    // Members P1
    const p1Members = [
      { email: 'manager@company.com', role: 'Engineering Lead' },
      { email: 'alice.smith@company.com', role: 'Backend Developer' },
      { email: 'bob.jones@company.com', role: 'QA Specialist' },
      { email: 'frank.taylor@company.com', role: 'DevOps Engineer' }
    ];
    for (const m of p1Members) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, team_role) VALUES ($1, $2, $3)`,
        [t1Id, getUserId(m.email), m.role]
      );
    }

    // Tasks P1
    const p1Tasks = [
      { title: 'Optimize Postgres connection Pool', desc: 'Configure db.js pool to reuse active clients', email: 'alice.smith@company.com', status: 'COMPLETED', days: 5 },
      { title: 'Implement Joi validation rules', desc: 'Write Joi validators for all create/update endpoints', email: 'alice.smith@company.com', status: 'IN_PROGRESS', days: 12 },
      { title: 'Integrate CORS headers validation', desc: 'Validate access permissions across custom origins', email: 'bob.jones@company.com', status: 'IN_PROGRESS', days: 7 }
    ];
    for (const t of p1Tasks) {
      await client.query(
        `INSERT INTO team_jobs (team_id, job_title, description, assigned_to, deadline, status)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::INTEGER, $6)`,
        [t1Id, t.title, t.desc, getUserId(t.email), t.days, t.status]
      );
    }


    // --- PROJECT 2: Security Audit Team ---
    const t2Res = await client.query(
      `INSERT INTO teams (team_name, description, team_lead_id, deadline, status)
       VALUES ('Security Audit Team', 'CORS configurations, logging checks, and security audits', $1, CURRENT_DATE + 15, 'ACTIVE')
       RETURNING id`,
      [getUserId('admin@company.com')]
    );
    const t2Id = t2Res.rows[0].id;

    // Members P2
    const p2Members = [
      { email: 'admin@company.com', role: 'Security Lead' },
      { email: 'frank.taylor@company.com', role: 'DevOps Specialist' },
      { email: 'bob.jones@company.com', role: 'Security Evaluator' }
    ];
    for (const m of p2Members) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, team_role) VALUES ($1, $2, $3)`,
        [t2Id, getUserId(m.email), m.role]
      );
    }

    // Tasks P2
    const p2Tasks = [
      { title: 'Audit role authorization levels', desc: 'Validate roles restrictions on payroll and staff details', email: 'admin@company.com', status: 'COMPLETED', days: 4 },
      { title: 'Draft CORS security policy doc', desc: 'Draft comprehensive domain rules for API CORS settings', email: 'bob.jones@company.com', status: 'PENDING', days: 10 }
    ];
    for (const t of p2Tasks) {
      await client.query(
        `INSERT INTO team_jobs (team_id, job_title, description, assigned_to, deadline, status)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::INTEGER, $6)`,
        [t2Id, t.title, t.desc, getUserId(t.email), t.days, t.status]
      );
    }


    // --- PROJECT 3: Frontend UI & Portal ---
    const t3Res = await client.query(
      `INSERT INTO teams (team_name, description, team_lead_id, deadline, status)
       VALUES ('Frontend UI & Portal', 'React, CSS styling, and glassmorphic user workspace portal', $1, CURRENT_DATE + 45, 'ACTIVE')
       RETURNING id`,
      [getUserId('jack.roberts@company.com')]
    );
    const t3Id = t3Res.rows[0].id;

    // Members P3
    const p3Members = [
      { email: 'jack.roberts@company.com', role: 'Lead Frontend Developer' },
      { email: 'alice.smith@company.com', role: 'UI Architect' },
      { email: 'charlie.brown@company.com', role: 'UX/UI Designer' },
      { email: 'emma.wilson@company.com', role: 'Quality Analyst' }
    ];
    for (const m of p3Members) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, team_role) VALUES ($1, $2, $3)`,
        [t3Id, getUserId(m.email), m.role]
      );
    }

    // Tasks P3
    const p3Tasks = [
      { title: 'Build dynamic ID Cards modal', desc: 'Implement interactive badge component with photo cycling', email: 'jack.roberts@company.com', status: 'COMPLETED', days: 8 },
      { title: 'Refactor team dashboards', desc: 'Style scrum timeline blocks to blend with HSL theme', email: 'alice.smith@company.com', status: 'IN_PROGRESS', days: 15 },
      { title: 'Create document manager components', desc: 'Add files uploader UI forms to Employee Directory modal', email: 'charlie.brown@company.com', status: 'PENDING', days: 20 }
    ];
    for (const t of p3Tasks) {
      await client.query(
        `INSERT INTO team_jobs (team_id, job_title, description, assigned_to, deadline, status)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::INTEGER, $6)`,
        [t3Id, t.title, t.desc, getUserId(t.email), t.days, t.status]
      );
    }


    // --- PROJECT 4: Cloud Infra & DevOps ---
    const t4Res = await client.query(
      `INSERT INTO teams (team_name, description, team_lead_id, deadline, status)
       VALUES ('Cloud Infra & DevOps', 'AWS deployments, Docker setups, and GitHub actions CI/CD pipelines', $1, CURRENT_DATE + 60, 'ACTIVE')
       RETURNING id`,
      [getUserId('frank.taylor@company.com')]
    );
    const t4Id = t4Res.rows[0].id;

    // Members P4
    const p4Members = [
      { email: 'frank.taylor@company.com', role: 'Cloud Lead' },
      { email: 'david.miller@company.com', role: 'Infra Specialist' },
      { email: 'henry.evans@company.com', role: 'Pipeline Engineer' }
    ];
    for (const m of p4Members) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, team_role) VALUES ($1, $2, $3)`,
        [t4Id, getUserId(m.email), m.role]
      );
    }

    // Tasks P4
    const p4Tasks = [
      { title: 'Setup docker-compose environment', desc: 'Dockerize frontend, backend, and postgres databases', email: 'frank.taylor@company.com', status: 'COMPLETED', days: 6 },
      { title: 'Configure AWS S3 storage logic', desc: 'Write backend static upload triggers using AWS SDK', email: 'david.miller@company.com', status: 'IN_PROGRESS', days: 18 },
      { title: 'Deploy staging build on ECS', desc: 'Configure GitHub Actions workflow to build and push to ECR', email: 'henry.evans@company.com', status: 'PENDING', days: 25 }
    ];
    for (const t of p4Tasks) {
      await client.query(
        `INSERT INTO team_jobs (team_id, job_title, description, assigned_to, deadline, status)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::INTEGER, $6)`,
        [t4Id, t.title, t.desc, getUserId(t.email), t.days, t.status]
      );
    }

    await client.query('COMMIT');
    console.log('✅ 4 sample projects successfully created, and employees successfully assigned to them!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding projects:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedProjects();
