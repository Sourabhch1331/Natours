const ReviewModel = require('../models/reviewModel');
const factory = require('./handlerFactor');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');


exports.setTourAnsUserId = (req,res,next) => {
    // nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    
    next();
}

exports.getAllReviews = factory.getAll(ReviewModel);
exports.getReviewById = factory.getOne(ReviewModel);

exports.createNewReview = factory.createOne(ReviewModel);
exports.updateReview = factory.updateOne(ReviewModel);
exports.deleteReview = factory.deleteOne(ReviewModel);