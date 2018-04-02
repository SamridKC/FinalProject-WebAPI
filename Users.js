// Tuan Phan

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.connect(process.env.DB);
//mongoose.connect('mongodb://localhost/hw3db');

// charity schema
var Charity = new Schema({
    name: { type: String, require: true, unique: true }
    amount: { type: Number, required: true }
})

// transaction schema
var TransactionSchema = new Schema({
    id: { type: Number, required: true, unique: true }
    date: { type: Date,required: true }
    total: { type: Number, require: true }
    charity: { type: Charity }
})

// user schema
var UserSchema = new Schema({
    name: String,
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true, select: false }
    transaction : {type: [TransactionSchema]}
});

// hash the password before the user is saved
UserSchema.pre('save', function(next) {
    var user = this;

    // hash the password only if the password has been changed or user is new
    if (!user.isModified('password')) return next();

    // generate the hash
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if (err) return next(err);

        // change the password to the hashed version
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password, callback) {
    var user = this;

    bcrypt.compare(password, user.password, function(err, isMatch) {
       callback(isMatch) ;
    });
};

// return the model
module.exports = mongoose.model('User', UserSchema);
