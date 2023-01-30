const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const TourModel = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getCheckOutSessions =catchAsync(async(req,res) => {
    // 1) Get the currently booked tour
    const tour=await TourModel.findById(req.params.tourId);

    // 2) Create checkout session
    const transformedItems = [{
        quantity: 1,
        price_data: {
            currency: "usd",
            unit_amount: tour.price,
            product_data: {
                name: `${tour.name} Tour`,
                description: tour.description, //description here
                images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`], //only accepts live images (images hosted on the internet),
            },
        },
    }]


    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email:req.user.email,
        client_reference_id: req.params.tourId,
        line_items: transformedItems,
        mode: 'payment'
    });
    // 3) Create session as response
    // console.log(session);
    res.status(200).json({
        status: 'success',
        session
    })
});