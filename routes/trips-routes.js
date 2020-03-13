const express = require('express');
const tripsControllers = require('../controllers/trips-controllers');
const router = express.Router();
const { check } = require('express-validator');
// const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');
const AWS = require("aws-sdk");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.get('/:pid', tripsControllers.getTripById);

router.get('/user/:uid', tripsControllers.getTripsByUserId);

router.use(checkAuth)  //all routes below this middleware are protected.

//  Code to write to local storage on the Node.js server
// router.post(
//     '/',
//     fileUpload.single('image'),
//     [
//         check('title').not().isEmpty(),
//         check('description').isLength({ min: 5 }),
//         check('address').not().isEmpty()
//     ],
//     tripsControllers.createTrip
// );


//  Code to write to Amazon S3 storage 
router.post('/', upload.single('image'), function (req, res) {
    const file = req.file;
    const s3FileURL = process.env.AWS_Uploaded_File_URL_LINK;
    let s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    //Where you want to store your file

    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read"
    };

    s3bucket.upload(params, function (err, data) {
        if (err) {
            res.status(500).json({ error: true, Message: err });
        } else {
            res.send({ data });
        }
    });
    tripsControllers.createTrip(req);
});


// good below

router.patch(
    '/:pid',
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 })
    ],
    tripsControllers.updateTrip);

// DELETE ROUTE
router.delete('/:pid', tripsControllers.deleteTrip);

module.exports = router;