const express=require('express');
const tourController=require('./../controllers/tourController')
const {getTourStats,aliasTopTours,getAllTours,addNewTour,getTourWithId,updateTour,deleteTour}= tourController;
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRouter');


const tourRouter = express.Router();


// POST /tour/tourid/reviews
// GET /tour/tourid/reviews
// GET /tour/tourid/reviews/reviewid


tourRouter.use('/:tourId/reviews',reviewRouter);
tourRouter.use('/:tourId/reviews',reviewRouter);

tourRouter.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getTourWithin);

tourRouter.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);
    

tourRouter.route('/top-5-cheap')
    .get(aliasTopTours,getAllTours);

tourRouter.route('/tour-stats')
    .get(getTourStats);

tourRouter.route('/')
    .get(getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin','lead-guide'),
        addNewTour
    ); 

tourRouter.route(`/:id`)
    .get(getTourWithId)
    .patch(
        authController.protect,
        authController.restrictTo('admin','lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin','lead-guide') ,
        deleteTour
    );



// tourRouter.route(`/:tourId/reviews`)
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createNewReview
//     );

module.exports=tourRouter;