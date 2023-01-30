const AppError = require("../utils/appError");

const handleCasteErrorDB=(err)=>{
    const message=`Invalid ${err.path}: ${err.value}`;
    return new AppError(message,400);
};

const handleDuplicateErrorDB= (err)=>{
    const KeyValue=Object.entries(err.keyValue).join(' ');
    const message=`Duplicate value for field { ${KeyValue.split(',').join(':')} }, Please use another value`;

    return new AppError(message,400);
};

const handleValidationErrorDB = err =>{
    const errors=Object.entries(err.errors).map(el => el[1].properties.message);
   
    
    const message=`Ivalid input Data: ${errors.join('. ')}`;
    return new AppError(message,400);
};

const handleJsonWebTokenError= () => new AppError('Ivalid token, Please log in again',401);

const handleJsonWebTokenExpiredWrror= () => new AppError('Token has expired! Please login again.',401);

const sendErrorDev= (err,req,res)=>{
    // console.log(req.originalUrl);
    // API 
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            error:err,
            message: err.message,
            stack:err.stack
        });
    }
    // REDNDERED WEBSITE
    res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: err.message
    });
};

const sendErrorProd=(err,req,res)=>{
    
    // API
    if(req.originalUrl.startsWith('/api')){
        // Operational, tusted error
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        
        // 1) Log the error
        console.error('Error 💥',err);
        
        // 2) send generic error
        return res.status(500).json({
            status: 'error',
            message: 'something went wrong!'
        });
    }
    
    // RENDERED WEBSITE
    if(err.isOperational){
        
        return res.status(err.statusCode).render('error',{
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    
    // 1) Log the error
    console.error('Error 💥',err);
    
    // 2) send generic error
    res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: 'Please try again later'
    });
}


module.exports=(err,req,res,next)=>{
    err.statusCode= err.statusCode || 500;
    err.status= err.status || 'err';


    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err,req,res);
    }
    else if(process.env.NODE_ENV === 'production'){
        let error=Object.assign({},err)
        error.message=err.message;

        if(err.name === 'CastError') error=handleCasteErrorDB(error)
        if(err.code === 11000) error=handleDuplicateErrorDB(error);
        if(err._message === 'Tour validation failed') error=handleValidationErrorDB(error);
        if(err.name === 'JsonWebTokenError') error=handleJsonWebTokenError();
        if(err.name === 'TokenExpiredError') error=handleJsonWebTokenExpiredWrror();
        

        sendErrorProd(error,req,res);
    }
}