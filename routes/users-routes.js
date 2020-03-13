const express = require('express');
const userController = require('../controllers/users-controllers');
const router = express.Router();
// const { check } = require('express-validator');
// const fileUpload = require('../middleware/file-upload');
const AWS = require("aws-sdk");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', userController.getUsers);

// Code to write to local storage on the node.js server
// router.post(
//     '/signup',
//     fileUpload.single('image'),
//     [
//         check('name').not().isEmpty(),
//         check('email').normalizeEmail().isEmail(),
//         check('password').isLength({ min: 6 })
//     ],
//     userController.signup);

//  Code to write to Amazon S3 storage 
router.post('/signup', upload.single('image'), function (req, res) {
    const file = req.file;
    // const s3FileURL = process.env.AWS_Uploaded_File_URL_LINK;
    // 
    //     check('name').not().isEmpty(),
    //     check('email').normalizeEmail().isEmail(),
    //     check('password').isLength({ min: 6 })
    // ],
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
    userController.signup(req);
});


router.post('/login', userController.login);

module.exports = router;