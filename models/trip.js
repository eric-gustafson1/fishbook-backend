const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tripSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    weather: { type: String },
    flies: { type: String },
    date: { type: Date },
    image: { type: String },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
});

module.exports = mongoose.model('Trip', tripSchema);

