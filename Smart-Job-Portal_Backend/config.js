module.exports = {
    development: {
        mongoURI: process.env.MONGO_URI,
        db: 'Job_Portal',
        auth: {
            secret: process.env.SESSION_SECRET,
            issuer: ''
        },
        port: {
            http: 8080
        },
        s3: {
            "BUCKET_NAME": process.env.S3_BUCKET_NAME,
            "BUCKET_FOLDER": process.env.S3_BUCKET_FOLDER,
            "AWS_REGION": process.env.AWS_REGION,
            "AWS_SECRET_ACCESS_KEY": process.env.AWS_SECRET_KEY,
            "AWS_ACCESS_KEY_ID": process.env.AWS_ACCESS_KEY
        },
        url: 'http://localhost:8080',
    }
}