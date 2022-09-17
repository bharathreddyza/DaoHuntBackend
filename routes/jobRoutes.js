const router = require('express').Router();
const jobController = require('../controllers/jobController');
const { isAdmin } = require('../middleware/middleware');

router.get('/all', jobController.getAllJobs);
router.post('/new', isAdmin, jobController.newJob);
router.post('/apply', jobController.applyJob);
router.get('/:contract', jobController.getDaoJobs);

module.exports = router;
