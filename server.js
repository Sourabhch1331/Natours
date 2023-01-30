const mongoose=require('mongoose');
const dotenv=require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNHANDLED EXCEPTION!💥 Shutting down....')
    console.log(err.name,err.message);
    process.exit(1);
});


dotenv.config({path: './config.env'});
const app=require('./app');



// Database connectivity (syntax change for newer mongoose versions)
const DB=process.env.DATABASE;

mongoose.connect (DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true 
})
.then(()=> console.log('DB connection successful!'));



// server ...
const port = process.env.PORT || 3030;

const server=app.listen(port, () => {
    console.log(`App running on the port ${port}....`);
});


process.on('unhandledRejection',err => {
    console.log('UNHANDLED REJECTION! Shutting down....')
    console.log(err.name,err.message);
    server.close(()=>{
        process.exit(1);
    });
});
