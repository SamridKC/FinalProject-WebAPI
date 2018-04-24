var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.connect(process.env.DB);
// transaction schema
var TransactionSchema = new Schema({
//    id: { type: Number, required: true, unique: true }
    Name: String,
    Date: { type: Date},
    Total: { type: Number, require: true },
    CreditCard: {type: String, require: true, min: 12, max: 12},
    ExpirationDate: {type: String, require: true},
    DonationAmount: {type: Number, require: true},
    CharityName: {type: String}
//    charity: { type: [Charity] }
});

TransactionSchema.pre('save', function(next) {
    var transaction = this;
    next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
