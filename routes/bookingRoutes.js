const express=require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const Router = express.Router();


Router.get('/chechout-session/:tourId',
    authController.protect,
    bookingController.getCheckOutSessions
);



module.exports = Router;