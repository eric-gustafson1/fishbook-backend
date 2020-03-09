const express = require('express');
const bodyParser = require('body-parser');
const tripsRoutes = require('./routes/trips-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// middleware to send headers back to the frontend to avoid CORS errors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();

});

// add trips-routes as middleware
app.use('/api/trips', tripsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err)
        });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(500);
    res.json({ message: error.message || 'An unknown error occured...' });
});

// MongoDB Atlas
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.MONGODB_ATLAS_PWD}@cluster0-qxkxd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(
        app.listen(process.env.PORT || 5000)
    ).catch((err) => {
        console.log(err)
    });