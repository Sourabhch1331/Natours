const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');


const signToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
};

const createAndSendToken = (user,statusCode,res)=>{
    const token=signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true
    };
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt',token,cookieOptions);
    user.password=undefined;
    
    res.status(statusCode).json({
        status: 'succes',
        token,
        data: {
            user
        }
    });
};

exports.signUp = catchAsync(async (req,res,next)=>{
    const newUser = await UserModel.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const url=`${req.protocol}://${req.get('host')}/me`;
    // console.log(url);
    await new Email(newUser,url).sendWelcome();

    createAndSendToken(newUser,201,res);
});
exports.login = catchAsync(async (req,res,next)=>{
    const {email,password} = req.body;
    // console.log(email,password);

    // 1) if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide email and password',400));
    }
    
    // 2) check if user exist && password is correct
    const user = await UserModel.findOne({email}).select('+password'); 

    if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect email or password',401));
    }

    // 3) If everything ok, send token to Client
    createAndSendToken(user,200,res);
});
 
exports.logout = (req,res) => {
    res.clearCookie('jwt');
    
    res.status(200).json({status : 'succes'});
}

exports.protect = catchAsync(async (req,res,next)=>{
    let token;
    // 1) Getting the Token and check if it's there
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    else if(req.cookies.jwt){
        token=req.cookies.jwt;
    }

    if(!token){
        return res.redirect('/');
    }

    // 2) Verification of Token
    const decoded= await promisify(jwt.verify)(token,process.env.JWT_SECRET);

    // 3) Check if user still exists
    const userId=decoded.id;
    const currUser= await UserModel.findById(userId);

    if(!currUser) return next(new AppError('User does no longer exist!',401));

    // 4) Check if user changed password after the token was issued
    if(currUser.changedPasswordsAfter(decoded.iat)) return next(new AppError('User changed password! Please login again.',401));
    
    // Authorization success!!
    // Grant Acces to Protected Route
    req.user = currUser;
    res.locals.user=currUser;
    
    next();
});

exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        // roles ['admin' , 'lead-guide']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action',403));
        }
        next();
    };
};



// Only for rendered pages , no errors!
exports.isLoggedIn = catchAsync(async (req,res,next)=>{

    // 1) Getting the Token and check if it's there
    if(req.cookies.jwt){
        let token=req.cookies.jwt;
    
        // 2) Verification of Token
        const decoded= await promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        );

        // 3) Check if user still exists
        const userId=decoded.id;
        const currUser= await UserModel.findById(userId);

        if(!currUser){
            return next();
        }
        // 4) Check if user changed password after the token was issued
        if(currUser.changedPasswordsAfter(decoded.iat)){
            return next();
        }

        // There is a Logged in user
        res.locals.user=currUser;
    }
    next();
});


exports.forgotPassword = catchAsync(async (req,res,next) => {
    // 1) Get User based on Posted email
    const user=await UserModel.findOne({email:req.body.email});

    if(!user){
        return next(new AppError('No user exist with email.',404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3) Send token to user's email
    
    try{
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user,resetURL).sendPasswordResent();

        res.status(200).json({
            status: 'succes',
            message: 'Token send to email!'
        });
    }catch(err){
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({validateBeforeSave:false});
        // console.log(err);
        
        return next(new AppError('There was some problem sending email! Try again later.',500));
    }
});

exports.resetPassword = catchAsync(async (req,res,next) => {
    
    // 1) Get user based on token
    const hashedToken = crypto  
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await UserModel.findOne({passwordResetToken: hashedToken,passwordResetExpires : {$gt:Date.now()}});
    
    // 2) If token has not expired, and there is user, set new password
    if(!user) return next(new AppError('Token is invalid or has expired',400));
    
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();

    // 3) Update changedPasswordAt proprty for the user
    // 4) Log the user in , send JWT
    createAndSendToken(user,200,res);
});

exports.updatePassword = catchAsync(async (req,res,next)=>{
    const {password,newPassword,newPasswordConfirm}=req.body;
    
    // check if user exist with email
    const user = await UserModel.findById(req.user._id).select('+password');
    if(!user) return next(new AppError('No User exist with given mail!',400));

    // check if password is correct
    if(!(await user.correctPassword(password,user.password))){
        return next(new AppError('Wrong password! Please try again.',401));
    }

    //update password to newPassword 
    user.password=newPassword;
    user.passwordConfirm=newPasswordConfirm;
    await user.save();

    // geneate jwt token and send
    createAndSendToken(user,200,res);

});


