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
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const uploadBase = isProduction ? os.tmpdir() : path.resolve(__dirname, '../');

// Scrum reports file upload configuration
const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadBase, 'uploads/reports');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn('Skipping folder creation for reports (read-only):', err.message);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const reportFileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG'), false);
  }
  cb(null, true);
};

const uploadReport = multer({
  storage: reportStorage,
  fileFilter: reportFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

// Scrum Task & Project Reports
router.get('/:id/scrum-reports', TeamController.getScrumReports);
router.post('/:id/scrum-reports', uploadReport.single('reportFile'), TeamController.createScrumReport);

// Simulated Git Repositories & Commits (Pushes)
router.get('/:id/repositories', TeamController.getRepositories);
router.post('/:id/repositories', TeamController.createRepository);
router.get('/:id/repositories/:repoId/commits', TeamController.getCommits);
router.post('/:id/repositories/:repoId/commits', TeamController.createCommit);

module.exports = router;
