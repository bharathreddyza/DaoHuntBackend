const router = require('express').Router();
const blogController = require('../controllers/blogController');
const { isAdmin } = require('../middleware/middleware');

router.get('/all', blogController.getAllBlogs);
router.post('/new', isAdmin, blogController.newBlog);
router.get('/:blog', blogController.getBlogDetail);
router.post('/upvote', blogController.upvoteBlog);

module.exports = router;
