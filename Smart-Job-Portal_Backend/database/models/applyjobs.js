const mongoose = require("mongoose");
const { Schema } = mongoose;

const ApplicationSchema = new Schema(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "recruiter",
      required: false
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "jobs",
      required: true
    },
    status: {
      type: String,
      enum: ["Applied", "Selected", "Rejected"],
      default: "Applied"
    },
    jobType: {
      type: String,
      default: "Full Time"
    },
    chatEnabled: {
      type: Boolean,
      default: false
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
