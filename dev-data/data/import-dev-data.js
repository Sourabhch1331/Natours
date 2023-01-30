const mongoose=require('mongoose');
const dotenv=require('dotenv');
const fs=require('fs');
const TourModel=require('../../models/tourModel');
const ReviewModel=require('../../models/reviewModel');
const UserModel=require('../../models/userModel');


dotenv.config({path: './config.env'});

// Database connectivity (syntax change for newer mongoose versions)
const DB=process.env.DATABASE;

mongoose.connect (DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
.then(()=> console.log('DB connection successful!'));



const tour=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const user=JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const review=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

//Import data into DB

const importData=async ()=>{
    try{
        await TourModel.create(tour);
        await UserModel.create(user,{validateBeforeSave: false});
        await ReviewModel.create(review);
        console.log('imported!');
    }catch(err){
        console.log(err);
    }
    process.exit();
}

// Delete all Data from DB

const deleteData= async ()=>{
    try{
        await TourModel.deleteMany();
        await UserModel.deleteMany();
        await ReviewModel.deleteMany();

        console.log('deleted');
    }catch(err){
        console.log(err);
    }
    process.exit();
}

if(process.argv[2]==='--import'){
    importData()
}else if(process.argv[2]==='--delete'){
    deleteData();
}

// console.log(process.argv);