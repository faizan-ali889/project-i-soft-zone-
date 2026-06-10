const TeamRepository = require('../repositories/teamRepository');
const db = require('../config/db');
const EmailService = require('./emailService');
const logger = require('../config/logger');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class TeamService {
  async getAllTeams() {
    return await TeamRepository.getAllTeams();
  }

  async getTeamDetail(teamId) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    const members = await TeamRepository.getTeamMembers(teamId);
    const jobs = await TeamRepository.getTeamJobs(teamId);
    
    return {
      ...team,
      members,
      jobs
    };
  }

  async createTeam(teamData) {
    return await TeamRepository.createTeam(teamData);
  }

  async updateTeam(id, teamData) {
    const existing = await TeamRepository.getTeamById(id);
    if (!existing) {
      throw new NotFoundError('Team not found');
    }
    return await TeamRepository.updateTeam(id, teamData);
  }

  async deleteTeam(id) {
    const existing = await TeamRepository.getTeamById(id);
    if (!existing) {
      throw new NotFoundError('Team not found');
    }
    return await TeamRepository.deleteTeam(id);
  }

  async addMember(teamId, memberData) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is already a member
    const members = await TeamRepository.getTeamMembers(teamId);
    const isAlreadyMember = members.some(m => m.user_id === memberData.user_id);
    if (isAlreadyMember) {
      throw new BadRequestError('User is already a member of this team');
    }

    return await TeamRepository.addTeamMember({
      team_id: teamId,
      user_id: memberData.user_id,
      team_role: memberData.team_role
    });
  }

  async removeMember(teamId, userId) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    const result = await TeamRepository.removeTeamMember(teamId, userId);
    if (!result) {
      throw new NotFoundError('Member association not found in this team');
    }
    return result;
  }

  async createJob(teamId, jobData) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const job = await TeamRepository.createTeamJob({
      team_id: teamId,
      job_title: jobData.job_title,
      description: jobData.description,
      assigned_to: jobData.assigned_to,
      deadline: jobData.deadline
    });

    // Send email notification if a member is assigned
    if (jobData.assigned_to) {
      try {
        const userQuery = await db.query('SELECT name, email FROM users WHERE id = $1', [jobData.assigned_to]);
        if (userQuery.rows.length > 0) {
          const user = userQuery.rows[0];
          const subject = `New Task Assigned in ${team.team_name}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
              <h2>Hello ${user.name},</h2>
              <p>You have been assigned a new task milestone in the team <strong>${team.team_name}</strong>.</p>
              <div style="padding: 15px; border-left: 4px solid #4f46e5; background-color: #f9fafb; margin: 15px 0;">
                <p><strong>Task:</strong> ${job.job_title}</p>
                <p><strong>Description:</strong> ${job.description || 'N/A'}</p>
                <p><strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
              </div>
              <p>Please check your team workspace and update the status accordingly.</p>
              <br>
              <p>Regards,<br><strong>Team Operations System</strong></p>
            </div>
          `;
          await EmailService.sendMail(user.email, subject, html);
        }
      } catch (err) {
        logger.error('Failed to send task assignment notification email:', err);
      }
    }

    return job;
  }

  async updateJob(teamId, jobId, jobData) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    
    // Validate job exists in this team
    const jobs = await TeamRepository.getTeamJobs(teamId);
    const exists = jobs.some(j => j.id === parseInt(jobId));
    if (!exists) {
      throw new NotFoundError('Task not found in this team');
    }

    return await TeamRepository.updateTeamJob(jobId, jobData);
  }

  async getTeamLeaderboard() {
    return await TeamRepository.getTeamLeaderboard();
  }

  async getTeamConflicts(teamId) {
    const members = await TeamRepository.getTeamMembers(teamId);
    const jobs = await TeamRepository.getTeamJobs(teamId);
    
    const memberIds = members.map(m => m.user_id);
    if (memberIds.length === 0) return [];

    // Fetch approved leaves for these members
    const leavesQuery = await db.query(`
      SELECT la.id, la.employee_id, la.from_date, la.to_date, la.status, u.name as employee_name
      FROM leave_applications la
      JOIN users u ON la.employee_id = u.id
      WHERE la.employee_id = ANY($1) AND la.status = 'APPROVED'
    `, [memberIds]);

    const leaves = leavesQuery.rows;
    const conflicts = [];

    for (const job of jobs) {
      if (!job.assigned_to) continue;
      const jobDeadline = new Date(job.deadline);
      const jobDeadlineStr = jobDeadline.toISOString().split('T')[0];
      
      const matchingLeave = leaves.find(l => {
        if (l.employee_id !== job.assigned_to) return false;
        
        const fromDate = new Date(l.from_date);
        const toDate = new Date(l.to_date);
        const fromDateStr = fromDate.toISOString().split('T')[0];
        const toDateStr = toDate.toISOString().split('T')[0];
        
        return jobDeadlineStr >= fromDateStr && jobDeadlineStr <= toDateStr;
      });

      if (matchingLeave) {
        conflicts.push({
          jobId: job.id,
          jobTitle: job.job_title,
          employeeId: job.assigned_to,
          employeeName: job.assignee_name,
          deadline: job.deadline,
          leaveId: matchingLeave.id,
          leaveFrom: matchingLeave.from_date,
          leaveTo: matchingLeave.to_date
        });
      }
    }

    return conflicts;
  }

  async getTeamCalendarEvents(teamId) {
    const team = await TeamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    const members = await TeamRepository.getTeamMembers(teamId);
    const jobs = await TeamRepository.getTeamJobs(teamId);
    
    const memberIds = members.map(m => m.user_id);
    let leaves = [];
    if (memberIds.length > 0) {
      const leavesQuery = await db.query(`
        SELECT la.id, la.employee_id, la.from_date, la.to_date, la.status, u.name as employee_name
        FROM leave_applications la
        JOIN users u ON la.employee_id = u.id
        WHERE la.employee_id = ANY($1) AND la.status = 'APPROVED'
      `, [memberIds]);
      leaves = leavesQuery.rows;
    }

    const conflicts = [];
    for (const job of jobs) {
      if (!job.assigned_to) continue;
      const jobDeadline = new Date(job.deadline);
      const jobDeadlineStr = jobDeadline.toISOString().split('T')[0];
      
      const matchingLeave = leaves.find(l => {
        if (l.employee_id !== job.assigned_to) return false;
        
        const fromDate = new Date(l.from_date);
        const toDate = new Date(l.to_date);
        const fromDateStr = fromDate.toISOString().split('T')[0];
        const toDateStr = toDate.toISOString().split('T')[0];
        
        return jobDeadlineStr >= fromDateStr && jobDeadlineStr <= toDateStr;
      });

      if (matchingLeave) {
        conflicts.push({
          jobId: job.id,
          jobTitle: job.job_title,
          employeeId: job.assigned_to,
          employeeName: job.assignee_name,
          deadline: job.deadline,
          leaveId: matchingLeave.id,
          leaveFrom: matchingLeave.from_date,
          leaveTo: matchingLeave.to_date
        });
      }
    }

    return {
      teamDeadline: team.deadline,
      jobs,
      leaves,
      conflicts
    };
  }
}

module.exports = new TeamService();
