const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    image: { type: String },
    trips: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Trip' }]

})

// mongoose-unique-validator enforces the email must be unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);