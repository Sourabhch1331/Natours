const path = require('path');
const express = require('express');
const morgan = require('morgan'); 
const rateLimit = require('express-rate-limit'); 
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError= require('./utils/appError');
const globalErrorHandler = require('./controllers/ErrorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const ReviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();
// Global middleware function....

app.set('view engine','pug');
app.set('views',path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));  

// Set security http headers
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'", 'http://127.0.0.1:3000/*'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: ["'self'", 'https://*.cloudflare.com' ],
        scriptSrc: ["'self'", 'https://*.stripe.com', 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js'],
        frameSrc: ["'self'", 'https://*.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', 'unsafe-inline'],
        upgradeInsecureRequests: [],
      },
    })
  );

// Development loging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev')); 
}

const limiter = rateLimit({
    max:100,
    windowMs:60*60*1000,
    message: 'Too many requests from this IP, please try again in an hour!' 
});
// limit requests from same IP
app.use('/api',limiter);

// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));                          // provide us body attribute in req variable
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit: '10kb'}));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent paramerter pollution...
app.use(hpp({
    whitelist: ['duration','ratingsAverage','difficulty','price','ratingsAverage']
}));

app.use(compression());

// Test middleWare
app.use((req, res, next) => {
    req.reqTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});


app.use('/',viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',ReviewRouter);
app.use('/api/v1/bookings',bookingRouter);


// --> Unhandled routes....
app.all('*',(req,res,next)=>{

    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404));
});

// Global error handler...

app.use(globalErrorHandler);


module.exports=app;
