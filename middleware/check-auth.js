const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');
require('dotenv').config();


module.exports = (req, res, next) => {

    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const token = req.headers.authorization.split(' ')[1];  // Bearer Token, so split and use the 2nd value 
        if (!token) {
            throw new Error('Authentication Failed...')
        }
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET)
        req.userData = {
            userId: decodedToken.userId
        }
        next();
    } catch (err) {
        const error = new HttpError('Authentication Failed...', 401);
        return next(error);
    }

}