const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required: [true, 'Please tell us your name!'],
        maxlength: 20
    },
    email:{
        type:String,
        required:[true,'Please provide your Email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail,'Please provide a valid Email']
    },
    photo:{
        type: String,
        default: 'default.jpg'
    },
    role:{
        type: String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password:{
        type:String,
        required:['true','Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm:{
        type:String,
        required : [true,'Please provide your password'],
        validate: {
            // This only works on SAVE!!
            validator: function(val){
                return this.password === val;
            },
            message: 'Password not same!'
        }
    },
    passwordsChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});

userSchema.pre(/^find/, function(next){
    this.find({active:{$ne:false}});
    next();
});

userSchema.pre('save',async function(next){
    // Only run this function if password was modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password,12)

    // Delete this field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordsChangedAt = Date.now()-1000;
    next();
});

// Instance methods...

userSchema.methods.correctPassword = async function(candidatePassword,userPassword) {
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordsAfter =  function(JWTTimestamp){
    if(this.passwordsChangedAt){
        const changedTimestamp = parseInt(this.passwordsChangedAt.getTime()/1000,10);
        return changedTimestamp > JWTTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
                                .createHash('sha256')
                                .update(resetToken)
                                .digest('hex');
    this.passwordResetExpires = Date.now()+10 * 60 * 1000;

    // send the unenctypted token
    return resetToken;
}


const UserModel= mongoose.model('User',userSchema);

module.exports=UserModel;