const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateCreateTeam,
  validateUpdateTeam,
  validateAddMember,
  validateTeamJob
} = require('../validators/team.validator');

// Leaderboard does not require team-specific ID
router.get('/leaderboard', TeamController.getTeamLeaderboard);

// Apply auth middleware to all write/details endpoints
router.use(authMiddleware);

router.get('/', TeamController.getAllTeams);
router.get('/:id', TeamController.getTeamDetail);
router.post('/', validateCreateTeam, TeamController.createTeam);
router.put('/:id', validateUpdateTeam, TeamController.updateTeam);
router.delete('/:id', TeamController.deleteTeam);

// Members Roster endpoints
router.post('/:id/members', validateAddMember, TeamController.addMember);
router.delete('/:id/members/:userId', TeamController.removeMember);

// Task Milestone Deliverables endpoints
router.post('/:id/jobs', validateTeamJob, TeamController.createJob);
router.put('/:id/jobs/:jobId', validateTeamJob, TeamController.updateJob);

// Leave Conflicts overlay check
router.get('/:id/conflicts', TeamController.getTeamConflicts);
router.get('/:id/calendar-events', TeamController.getTeamCalendarEvents);

module.exports = router;
