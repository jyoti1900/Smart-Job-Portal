const mongoose = require("mongoose");
const { Schema } = mongoose;

const CallEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "call_started",
        "call_accepted",
        "call_rejected",
        "call_ended"
      ],
      required: true
    },

    byRole: {
      type: String,
      enum: ["job_provider", "job_seeker"],
      required: true
    },

    at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const ApplicationCallSchema = new Schema(
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

    callType: {
      type: String,
      enum: ["video", "audio"],
      default: "video"
    },

    status: {
      type: String,
      enum: ["idle", "ringing", "ongoing", "ended"],
      default: "idle"
    },

    events: [CallEventSchema],

    startedAt: Date,
    endedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApplicationCall", ApplicationCallSchema);
