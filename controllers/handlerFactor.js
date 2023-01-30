const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/APIfeatures.js');

exports.deleteOne = Model => catchAsync(async (req, res,next) => {
    const doc=await Model.findByIdAndDelete(req.params.id);
    
    if(!doc){
        return next(new AppError('Document Not Found!',404));
    }
    
    res.status(204).json({
        status: 'succes',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res,next) => {
    const updatedDoc= await Model.findByIdAndUpdate(req.params.id,req.body,{
        new: true,
        runValidator:true
    });
    if(!updatedDoc){
        return next(new AppError('Document Not Found with this Id!',404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: updatedDoc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res,next) => {
    const newDoc=await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            data: newDoc
        }
    });
});

exports.getOne = (Model,populateOption) => catchAsync(async (req, res,next) => {
    let query = Model.findById(req.params.id);
    if(populateOption) query=query.populate(populateOption);

    const doc=await query;
    
    if(!doc){
        return next(new AppError('Document with Id Not Found!',404));
    }

    res.status(200).json({
        status: 'succes',
        data: {
            data:doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res,next) => {
    
    // To allow for nested GET reviews in tour
    let options = {};
    if(req.params.tourId) options.tour=req.params.tourId;
    
    const features= new APIfeatures(Model.find(options),req.query)
        .filter()
        .sort()
        .limitField()
        .paginate();
        
    // const doc=await features.query.explain();
    const doc=await features.query;

    res.status(200).json({
        status: 'succes',
        results: doc.length,
        data: {
            data:doc
        }
    });
});
