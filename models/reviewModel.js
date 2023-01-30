const mongoose = require('mongoose');
const TourModel = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        required: [true,'A review must not be Empty.']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true,'Review must belong to a Tour.']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true,'Review must belong to a User.']
    }
},
{
    toJSON:{virtuals: true},
    toObjects:{virtuals: true}
});

reviewSchema.index({tour: 1 , user: 1},{unique: true});

reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        { 
            $match: { tour:tourId }
        },
        { 
            $group: {
                _id: '$tour',
                nRating: { $sum:1 },
                avgRating: { $avg:'$rating' }
            }
        }
    ]);

    if(stats.length){
        await TourModel.findByIdAndUpdate(tourId, {
            ratingsQuantity:stats[0].nRating,
            ratingsAverage:stats[0].avgRating
        });
    }
    else{
        await TourModel.findByIdAndUpdate(tourId, {
            ratingsQuantity:0,
            ratingsAverage:4.5
        });
    }
    // console.log(stats);
}


reviewSchema.post('save',function(){

    // this.constructor points to Model
    this.constructor.calcAverageRatings(this.tour);

});

reviewSchema.post(/^findOneAnd/, async function(doc){
    if(doc) await doc.constructor.calcAverageRatings(doc.tour);
});


const ReviewModel = new mongoose.model('ReviewModel',reviewSchema);

module.exports = ReviewModel;