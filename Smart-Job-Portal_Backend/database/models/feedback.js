// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const feedbackSchema = new Schema(
//   {
//     fd_name: {
//         type: String,
//         required: true,
//     },
//     fd_rating: {
//         type: Number,
//         required: true,
//         min: 1,
//         max: 5,
//     },
//     fd_subject: {
//         type: String,
//         required: true,
//     },
//     fd_message: {
//         type: String,
//         required: true,
//     },
//     fd_dishompagButton: {
//         type: String,
//         value: Boolean,
//     },
//     // publish_status: {
//     //     type: String,
//     //     enum: ["public", "private"], // Define allowed values using enum
//     //     required: true,
//     // },
//     deleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("feedback", feedbackSchema);
