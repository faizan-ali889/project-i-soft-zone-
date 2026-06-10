const db = require('../config/db');

class TeamRepository {
  async getAllTeams() {
    const query = `
      SELECT * FROM team_performance_view 
      ORDER BY team_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getTeamById(id) {
    const query = `
      SELECT t.*, u.name as team_lead_name, u.email as team_lead_email
      FROM teams t
      LEFT JOIN users u ON t.team_lead_id = u.id
      WHERE t.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async getTeamMembers(teamId) {
    const query = `
      SELECT tm.id as membership_id, tm.user_id, tm.team_role, tm.assigned_at,
             u.name as employee_name, u.email, u.role,
             ep.designation, ep.phone
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE tm.team_id = $1
      ORDER BY u.name ASC
    `;
    const result = await db.query(query, [teamId]);
    return result.rows;
  }

  async getTeamJobs(teamId) {
    const query = `
      SELECT tj.*, u.name as assignee_name, u.email as assignee_email
      FROM team_jobs tj
      LEFT JOIN users u ON tj.assigned_to = u.id
      WHERE tj.team_id = $1
      ORDER BY tj.deadline ASC, tj.created_at ASC
    `;
    const result = await db.query(query, [teamId]);
    return result.rows;
  }

  async createTeam({ team_name, description, team_lead_id, deadline }) {
    const query = `
      INSERT INTO teams (team_name, description, team_lead_id, deadline)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [team_name, description, team_lead_id, deadline]);
    return result.rows[0];
  }

  async updateTeam(id, { team_name, description, team_lead_id, deadline, status }) {
    const query = `
      UPDATE teams
      SET team_name = $1, description = $2, team_lead_id = $3, deadline = $4, status = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const result = await db.query(query, [team_name, description, team_lead_id, deadline, status, id]);
    return result.rows[0];
  }

  async deleteTeam(id) {
    const query = `DELETE FROM teams WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async addTeamMember({ team_id, user_id, team_role }) {
    const query = `
      INSERT INTO team_members (team_id, user_id, team_role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [team_id, user_id, team_role]);
    return result.rows[0];
  }

  async removeTeamMember(team_id, user_id) {
    const query = `
      DELETE FROM team_members 
      WHERE team_id = $1 AND user_id = $2 
      RETURNING id
    `;
    const result = await db.query(query, [team_id, user_id]);
    return result.rows[0];
  }

  async createTeamJob({ team_id, job_title, description, assigned_to, deadline }) {
    const query = `
      INSERT INTO team_jobs (team_id, job_title, description, assigned_to, deadline)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [team_id, job_title, description, assigned_to, deadline]);
    return result.rows[0];
  }

  async updateTeamJob(jobId, { job_title, description, assigned_to, deadline, status }) {
    const query = `
      UPDATE team_jobs
      SET job_title = $1, description = $2, assigned_to = $3, deadline = $4, status = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const result = await db.query(query, [job_title, description, assigned_to, deadline, status, jobId]);
    return result.rows[0];
  }

  async getTeamLeaderboard() {
    // Rank teams based on task completion rate, then total completed tasks, and total members
    const query = `
      SELECT *,
             RANK() OVER (ORDER BY completion_rate DESC, completed_jobs DESC) as rank
      FROM team_performance_view
      ORDER BY completion_rate DESC, completed_jobs DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new TeamRepository();
