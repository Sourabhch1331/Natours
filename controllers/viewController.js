const TourModel = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const UserModel = require('../models/userModel');

exports.getOverview =catchAsync( async (req,res,next)=>{
    const tours = await TourModel.find();
    
    res.status(200).render('overview',{
        title: 'All Tours',
        tours
    });
});

exports.getTour =catchAsync(async (req,res,next)=>{
    const tour = await TourModel.findOne({slug:req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if(!tour){
        // console.log('here');
        return next(new AppError('There is no tour with that name.',404));
    }
    res.status(200).render('tour',{
        title: `${tour.name} Tour`,
        tour
    });
}); 

exports.getLoginForm = (req,res)=>{
    
    res.status(200).set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com"
    ).render('login',{
        title: 'log into your account'
    });

};

exports.getAccount = (req,res) => {
    res.status(200).render('account',{
        title: 'Your Account'
    });
}

exports.updateUserData=catchAsync (async (req,res,next) => {
    const updatedUser= await UserModel.findByIdAndUpdate(req.user.id,{
        name:req.body.name,
        email:req.body.email
    },{
        new: true,
        runValidator: true
    });


    res.status(200).render('account',{
        title: 'Your account',
        user: updatedUser
    });

});