const multer = require('multer');
const sharp = require('sharp');
const UserModel = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactor');

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('Not an Image! Please upload only images',400),false);
    }

}

const upload = multer({ 
    storage: multerStorage,
    fileFilter:multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async (req,res,next) => {
    if(!req.file) return next();
    req.file.filename= `user-${req.params.id}.jpeg`;
    
    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj,...keep)=>{
    const filteredObj={};
    Object.entries(obj).forEach(el=>{
        if(keep.includes(el[0])) filteredObj[el[0]]=el[1];
    });
    return filteredObj;
};


exports.updateMe= catchAsync(async (req,res,next)=>{
    // console.log(req.file);
    // console.log(req.body);
    
    // 1) Create error if user try to update passwrod data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update!',400));
    }
   
    // 2) update user document
    const filteredBody= filterObj(req.body,'name','email');
    if(req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await UserModel.findByIdAndUpdate(req.user._id,filteredBody,{
        new:true,runValidators:true
    });

    res.status(200).json({
        status: 'succes',
        data:{
            user:updatedUser
        }
    });
});


exports.deleteMe = catchAsync(async (req,res,next)=>{
    await UserModel.findByIdAndUpdate(req.user._id,{active:false});
    res.status(204).json({
        status:'sucess',
        data:null
    });
});

exports.createUser=(req,res)=>{
    res.status(200).json({
        status: 'succes',
        data: {
            users: 'Please use signup!'
        }
    });
};
exports.getMe= (req,res,next)=>{
    req.params.id= req.user.id;
    next();
};

exports.getAllUsers=factory.getAll(UserModel);
exports.getUserWithId=factory.getOne(UserModel);

// Do not uodate password with this
exports.updateUser=factory.updateOne(UserModel);
exports.deleteUser= factory.deleteOne(UserModel);