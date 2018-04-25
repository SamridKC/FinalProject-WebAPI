var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.connect(process.env.DB);

//Product Schema
var ProductSchema = new Schema({
    Name: { type: String, require: true, unique: true},
    Price: { type: Number, required: true },
    imageUrl: { type: String, required: true }
});

ProductSchema.pre('save', function(next) {
    var product = this;
    next();
});

module.exports = mongoose.model('Product', ProductSchema);
