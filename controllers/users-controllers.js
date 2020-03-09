const HttpError = require('../models/http-error');
const uuid = require('uuid/v4');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
require('dotenv').config();


// Get users from DB
const getUsers = async (req, res, next) => {

    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError('Error: cannot get users from db', 500);
        return next(error);
    }

    res.json({ users: users.map(user => user.toObject({ getters: true })) })
};

// Sign up a new application user
const signup = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return next(new HttpError('Invalid inputs on required fields', 422));
    }
    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed', 500);
        return next(err);
    }

    if (existingUser) {
        const error = new HttpError('That email address is already registered, switch to LOGIN...', 422);
        return next(error);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not add new user, please try again', 500);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        trips: []
    });

    //Save to MongoDB using mongoose
    try {
        createdUser.save();
    } catch (err) {
        const error = new HttpError('Signup new user failed...', 500);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Signup new user failed...', 500);
        return next(error);
    }

    res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Login failed', 500);
        return next(err);
    }

    if (!existingUser) {
        const error = new HttpError('Invalid credentials, could not log you in', 401);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        const error = new HttpError('Could not log you in, try again...', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid credentials, could not log you in', 401);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Login failed...', 500);
        return next(error);
    }


    res.json({ userId: existingUser.id, email: existingUser.email, token: token });

};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
