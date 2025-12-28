// const AWS = require("aws-sdk");
// const { HttpRequest } = require("@aws-sdk/protocol-http");
// const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
// const { parseUrl } = require("@aws-sdk/url-parser");
// const { Hash } = require("@aws-sdk/hash-node");
// const { formatUrl } = require("@aws-sdk/util-format-url");
// const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET_NAME } =
//     global.config.s3;

// exports.writeToS3 = async (data, type, fileName, bucketName, bucketFolder) => {
//     try {
//         const bucket = bucketName + (bucketFolder ? ("/" + bucketFolder) : "");
//         const s3 = new AWS.S3({
//             region: AWS_REGION,
//             secretAccessKey: AWS_SECRET_ACCESS_KEY,
//             accessKeyId: AWS_ACCESS_KEY_ID,
//             Bucket: bucket || BUCKET_NAME,
//         });

//         const params = {
//             Bucket: bucket || BUCKET_NAME,
//             Key: fileName,
//             ContentType: type,
//             Body: data,
//             // ACL: "public-read",
//         };

//         let fileUpload = await s3.upload(params).promise();
//         return fileUpload || false;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// };

// exports.getSignedUrl = async (key, bucketName) => {
//     try {
//         let credentials = {
//             accessKeyId: AWS_ACCESS_KEY_ID,
//             secretAccessKey: AWS_SECRET_ACCESS_KEY,
//         };

//         const s3ObjectUrl = parseUrl(
//             `https://${
//                 bucketName || BUCKET_NAME
//             }.s3.${AWS_REGION}.amazonaws.com/${key}`
//         );
//         const presigner = new S3RequestPresigner({
//             credentials,
//             region: AWS_REGION,
//             //   sha256: Sha256,
//             sha256: Hash.bind(null, "sha256"),
//         });

//         // Create a GET request from S3 url.
//         const url = await presigner.presign(new HttpRequest(s3ObjectUrl));
//         return formatUrl(url);
//     } catch (error) {
//         console.log(error);
//         return error;
//     }
// };
