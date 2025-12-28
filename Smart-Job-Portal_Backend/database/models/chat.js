const mongoose = require("mongoose");
const { Schema } = mongoose;


const ApplicationChatSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true
    },

    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "recruiter",
      required: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    messages: [
      {
        senderRole: {
          type: String,
          enum: ["job_provider", "job_seeker"],
          required: true
        },

        senderId: {
          type: Schema.Types.ObjectId,
          required: true
        },

        message: {
          type: String,
          required: true,
          trim: true
        },

        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ApplicationChat", ApplicationChatSchema);
