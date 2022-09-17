const router = require('express').Router();
const reviewController = require('../controllers/reviewController');

router.post('/reply', reviewController.newReply);
router.post('/upvote', reviewController.upvoteReview);
// router.post('/upvote/cancel', reviewController.removeUpvote);

router
  .route('/:contract')
  .post(reviewController.newReview)
  // .get(reviewController.getReviews)
  // .delete(reviewController.deleteReview);



module.exports = router;
