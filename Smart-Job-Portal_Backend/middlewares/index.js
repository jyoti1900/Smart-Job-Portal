const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

exports.uploadImg = multer({
    storage: multer.diskStorage({
        destination: "public/uploads/",
        filename: (req, file, cb) => {
            if (
                file.mimetype == "image/png" ||
                file.mimetype == "image/jpg" ||
                file.mimetype == "image/jpeg" ||
                file.mimetype == "video/mp4"
            ) {
                cb(null, Date.now() + path.extname(file.originalname));
            } else {
                cb("Error: Invalid filetype");
            }
        }
    })
}).single("profile_image");

exports.uploadImgs = multer({
    storage: multer.diskStorage({
        destination: "public/uploads/",
        filename: (req, file, cb) => {
            if (
                file.mimetype == "image/png" ||
                file.mimetype == "image/jpg" ||
                file.mimetype == "image/jpeg" ||
                file.mimetype == "video/mp4"
            ) {
                cb(null, Date.now() + path.extname(file.originalname));
            } else {
                cb("Error: Invalid filetype");
            }
        }
    })
}).single("image");

exports.uploadFile = multer({
    storage: multer.diskStorage({
        destination: "public/uploads/",
        filename: (req, file, cb) => {
            if (file.mimetype == "application/pdf" || file.mimetype == "application/msword") {
                cb(null, Date.now() + path.extname(file.originalname));
            } else {
                cb("Error: Invalid filetype");
            }
        }
    })
}).single("document");

exports.uploadFiles = multer({
    storage: multer.diskStorage({
        destination: "public/uploads/",
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/png",
            "image/jpg",
            "image/jpeg",
            "video/mp4",
            "application/pdf",
            "application/msword"
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb("Error: Invalid filetype");
    }
}).fields([
    { name: "profile_image", maxCount: 5 },
    { name: "image", maxCount: 5 },
    { name: "document", maxCount: 5 },
]);

exports.validateToken = (req, res, next) => {
    let authToken = req.headers.authorization;
    if (authToken) {
        authToken = authToken.split(" ")[1]; // Bearer <token>

        try {
            req.userDetails = jwt.verify(authToken, process.env.KEY);
            next();
        } catch (err) {
            return res.status(403).json({ success: false, message: "Invalid auth token" });
        }
    } else {
        return res.status(403).json({ success: false, message: "Token required" });
    }
};

