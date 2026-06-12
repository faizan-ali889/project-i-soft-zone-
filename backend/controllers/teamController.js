const TeamService = require('../services/teamService');

class TeamController {
  async getAllTeams(req, res, next) {
    try {
      const teams = await TeamService.getAllTeams();
      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async getTeamDetail(req, res, next) {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamDetail(id);
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async createTeam(req, res, next) {
    try {
      const team = await TeamService.createTeam(req.validatedData);
      res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
      next(error);
    }
  }

  async updateTeam(req, res, next) {
    try {
      const { id } = req.params;
      const team = await TeamService.updateTeam(id, req.validatedData);
      res.json({ message: 'Team updated successfully', team });
    } catch (error) {
      next(error);
    }
  }

  async deleteTeam(req, res, next) {
    try {
      const { id } = req.params;
      await TeamService.deleteTeam(id);
      res.json({ message: 'Team deleted successfully', id });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const { id } = req.params;
      const member = await TeamService.addMember(id, req.validatedData);
      res.status(201).json({ message: 'Member added to team successfully', member });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      await TeamService.removeMember(id, userId);
      res.json({ message: 'Member removed from team successfully', userId });
    } catch (error) {
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const { id } = req.params;
      const job = await TeamService.createJob(id, req.validatedData);
      res.status(201).json({ message: 'Task milestone created successfully', job });
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const { id, jobId } = req.params;
      const job = await TeamService.updateJob(id, jobId, req.validatedData);
      res.json({ message: 'Task milestone updated successfully', job });
    } catch (error) {
      next(error);
    }
  }

  async getTeamLeaderboard(req, res, next) {
    try {
      const leaderboard = await TeamService.getTeamLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  }

  async getTeamConflicts(req, res, next) {
    try {
      const { id } = req.params;
      const conflicts = await TeamService.getTeamConflicts(id);
      res.json(conflicts);
    } catch (error) {
      next(error);
    }
  }

  async getTeamCalendarEvents(req, res, next) {
    try {
      const { id } = req.params;
      const events = await TeamService.getTeamCalendarEvents(id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  async getScrumReports(req, res, next) {
    try {
      const { id } = req.params;
      const reports = await TeamService.getScrumReports(id);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  async createScrumReport(req, res, next) {
    try {
      const { id } = req.params;
      const reportData = {
        report_type: req.body.report_type,
        tasks_completed: req.body.tasks_completed,
        tasks_planned: req.body.tasks_planned,
        blockers: req.body.blockers,
        file: req.file
      };
      const report = await TeamService.createScrumReport(id, req.user.id, reportData);
      res.status(201).json({ message: 'Scrum report uploaded successfully', report });
    } catch (error) {
      next(error);
    }
  }

  async getRepositories(req, res, next) {
    try {
      const { id } = req.params;
      const repos = await TeamService.getRepositories(id);
      res.json(repos);
    } catch (error) {
      next(error);
    }
  }

  async createRepository(req, res, next) {
    try {
      const { id } = req.params;
      const { repo_name, description } = req.body;
      const repo = await TeamService.createRepository(id, { repo_name, description });
      res.status(201).json({ message: 'Repository created successfully', repo });
    } catch (error) {
      next(error);
    }
  }

  async getCommits(req, res, next) {
    try {
      const { repoId } = req.params;
      const commits = await TeamService.getCommits(repoId);
      res.json(commits);
    } catch (error) {
      next(error);
    }
  }

  async createCommit(req, res, next) {
    try {
      const { repoId } = req.params;
      const { branch_name, commit_message, changed_files } = req.body;
      const commit = await TeamService.createCommit(repoId, req.user.id, {
        branch_name,
        commit_message,
        changed_files
      });
      res.status(201).json({ message: 'Code pushed successfully', commit });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamController();
