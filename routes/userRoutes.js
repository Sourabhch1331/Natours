const express=require('express');

const userController=require('./../controllers/userController');
const authController=require('./../controllers/authController');
const {getMe,deleteMe,updateMe,createUser,getUserWithId,updateUser,deleteUser,getAllUsers}=userController;


const userRouter = express.Router();

// Special Routes...
userRouter.post('/signup',authController.signUp);
userRouter.post('/login',authController.login);
userRouter.get('/logout',authController.logout);

userRouter.post('/forgotPassword',authController.forgotPassword);
userRouter.patch('/resetPassword/:token',authController.resetPassword);

// Protect all routes after this
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword',
    authController.updatePassword
);
userRouter.patch('/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    updateMe
);
userRouter.delete('/deleteMe',deleteMe);

userRouter.get('/me',
    getMe,              // middleware to get user id in req.params
    getUserWithId
);


// All routes after this are restricted to admin only
userRouter.use(authController.restrictTo('admin'));

// Resource Routes...
userRouter
    .route('/')
    .get(getAllUsers)
    .post(createUser);
userRouter
    .route('/:id')
    .get(getUserWithId)
    .patch(updateUser)
    .delete(deleteUser);

module.exports=userRouter;