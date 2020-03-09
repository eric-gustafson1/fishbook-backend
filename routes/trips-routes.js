const express = require('express');
const tripsControllers = require('../controllers/trips-controllers');
const router = express.Router();
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');


router.get('/:pid', tripsControllers.getTripById);

router.get('/user/:uid', tripsControllers.getTripsByUserId);

router.use(checkAuth)  //all routes below this middleware are protected.

router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address').not().isEmpty()
    ],
    tripsControllers.createTrip
);

router.patch(
    '/:pid',
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 })
    ],
    tripsControllers.updateTrip);

router.delete('/:pid', tripsControllers.deleteTrip);

module.exports = router;