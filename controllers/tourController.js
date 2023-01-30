const multer = require('multer');
const sharp  = require('sharp');
const TourModel = require('../models/tourModel');
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


exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount:1},
    {name : 'images', maxCount:3}
]);

// upload.single('image')   for single upload
// upload.array('images',5)  for multiple uploads
// and fields is mixed one


exports.resizeTourImages =catchAsync( async (req,res,next) => {
    // console.log(req.files);

    if(!req.files.imageCover || !req.files.images) return next();
    
    //imagecover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${req.body.imageCover }`);


    // images
    req.body.images = [];
    await Promise.all( req.files.images.map(async (file,i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
        await sharp(file.buffer)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality:90})
            .toFile(`public/img/tours/${filename}`);
        
            req.body.images.push(filename);
        })
    )


    next();
});

// Middle ware
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-price';
    req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
    next();
};

// Route handler functions

exports.getAllTours = factory.getAll(TourModel);

exports.getTourWithId = factory.getOne(TourModel, 'reviews');

exports.addNewTour = factory.createOne(TourModel);

exports.updateTour = factory.updateOne(TourModel);

exports.deleteTour = factory.deleteOne(TourModel);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await TourModel.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                countOfTours: { $sum: 1 },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
    ]);
    res.status(200).json({
        stauts: 'success',
        stats,
    });
});

///tours-within/:distance/center/:lng/unit/:unit
// /tours-within/256/center/-40,45/unit/miles

exports.getTourWithin =catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');
    const radius = (unit === 'mi' ? distance/3963.2 : distance/6378.1);

    if(!lat || !lng){
        next(new AppError('Please specify your location(latitude and longitude).',400));
    }

    const tours = await TourModel.find({ 
        startLocation: {
            $geoWithin:{
                $centerSphere:[[lng,lat],radius] 
            }
        } 
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data:tours
        }
    })
});


exports.getDistances = catchAsync(async (req,res,next) => {
    const {latlng,unit} = req.params;
    const [lat,lng]=latlng.split(',');

    if(!lat || !lng){
        return next(new AppError('Please provide lat and lng'));
    }

    const multiplier = (unit === 'mi' ? 0.000621371:0.001);

    const distances = await TourModel.aggregate([
        { 
            $geoNear: { 
                near:{
                    type: 'Point',
                    coordinates: [lng*1, lat*1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data:distances
        }
    })

});