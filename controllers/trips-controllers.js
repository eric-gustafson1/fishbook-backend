const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const getCoordinatesForAddress = require('../util/location');
const Trip = require('../models/trip');
const User = require('../models/user');
const mongoose = require('mongoose');
// const fs = require('fs');
const AWS = require("aws-sdk");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Get trip by trip id
const getTripById = async (req, res, next) => {
    const tripId = req.params.pid;
    let trip;

    try {
        trip = await Trip.findById(tripId);
    } catch (err) {
        const error = new HttpError('No trip found with that id...', 500);
        return next(error);
    }


    if (!trip) {
        const error = new HttpError('Could not find a trip matching place id...', 404);
        return next(error);
    }

    res.json({ trip: trip.toObject({ getters: true }) });
}

//Get trips by user id
const getTripsByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let trips;

    try {
        trips = await Trip.find({ creator: userId });
    } catch (err) {
        const error = new HttpError('No trip found for user ID', 500);
        return next(error);
    }


    if (!trips || trips.length === 0) {
        return next(new HttpError('There are no trips for that username...', 404));
    }

    res.json({ trips: trips.map(trip => trip.toObject({ getters: true })) })
}

// Create a new trip
const createTrip = async (req, res, next) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return next(new HttpError('Invalid inputs on required fields', 422))
    // }

    const { title, description, address, weather, flies, date } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordinatesForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdTrip = new Trip({
        title,
        description,
        weather,
        flies,
        date,
        address,
        location: coordinates,
        image: req.file.originalname,
        creator: req.userData.userId
    })

    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Create trip failed', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Cound not find a user with the provided id', 404);
        return next(error);
    }

    //Save to MongoDB using mongoose
    // Only save if both user id is added to trip and trip addded to user
    try {
        // Need mongo cluster or replica for this session code
        const session = await mongoose.startSession();
        session.startTransaction();
        await createdTrip.save({ session: session });
        user.trips.push(createdTrip);
        await user.save({ session: session });
        await session.commitTransaction();
    } catch (err) {
        const error = new HttpError('Creating trip failed...', 500);
        return next(error)
    }

    res.status(201).json({ trip: createdTrip })
}

const updateTrip = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors)
        return next(new HttpError('Invalid inputs on required fields', 422))
    }

    const { title, description, weather, flies } = req.body;
    const tripId = req.params.pid;

    let trip;
    try {
        trip = await Trip.findById(tripId)
    } catch (err) {
        const error = new HttpError('Could not update trip with that id', 500);
        return next(error);
    }

    if (trip.creator.toString() !== req.userData.userId) {
        const error = new HttpError('You are not allowed to edit this trip...', 401);
        return next(error);
    }

    trip.title = title;
    trip.description = description;
    trip.weather = weather;
    trip.flies = flies;

    try {
        await trip.save();
    } catch (err) {
        const error = new HttpError('The update has an error...', 500);
        return next(error);
    }

    res.status(200).json({ trip: trip.toObject({ getters: true }) });
}

const deleteTrip = async (req, res, next) => {
    const tripId = req.params.pid;

    let trip;
    try {
        trip = await Trip.findById(tripId).populate('creator');
    } catch (err) {
        const error = new HttpError('Error: could not delete trip. ', 500);
        return next(error);
    }

    if (!trip) {
        const error = new HttpError('Could not find trip for this id', 404);
        return next(error);
    }

    if (trip.creator.id !== req.userData.userId) {
        const error = new HttpError('You cannot delete this trip...', 401);
        return next(error);
    }


    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await trip.remove({ session: session });
        trip.creator.trips.pull(trip);
        await trip.creator.save({ session: session });
        await session.commitTransaction();

    } catch (err) {
        const error = new HttpError('Error: Remove on DB failed', 500)
        return next(error);
    }

    // Remove the image from AWS S3 bucket
    let imagePath = trip.image

    let s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imagePath
    };

    await s3bucket.deleteObject(params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ message: 'Trip deleted' });

        }
    });



}

exports.getTripById = getTripById;
exports.getTripsByUserId = getTripsByUserId;
exports.createTrip = createTrip;
exports.updateTrip = updateTrip;
exports.deleteTrip = deleteTrip;
