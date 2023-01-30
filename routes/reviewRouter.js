const express=require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const Router = express.Router({ mergeParams: true });
//{ mergeParams: true } -> merege the params of previous routes

Router.use(authController.protect);

Router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourAnsUserId,
        reviewController.createNewReview
    );

Router.route('/:id')
    .delete(
        authController.restrictTo('user','admin'),
        reviewController.deleteReview
    )
    .patch(
        authController.restrictTo('user','admin'),
        reviewController.updateReview
    )
    .get(
        reviewController.getReviewById
    )

module.exports = Router;