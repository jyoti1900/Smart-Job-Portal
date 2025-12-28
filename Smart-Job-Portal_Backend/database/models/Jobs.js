const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobSchema = new Schema(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "recruiter",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    cat_name: {
      type: String,
      required: true
    },
    postDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    experience: {
      type: String,
      required: true
    },
    salary: {
      type: String,
      required: true
    },
    jobType: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active"
    },
    skills: {
      type: [String],
      required: true
    },
    education: {
      type: String,
      default: ""
    },
    jobAppliedCount: {
      type: Number,
      default: 0
    },

    deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// format date
JobSchema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.postDate) ret.postDate = ret.postDate.toISOString().split("T")[0];
    if (ret.endDate) ret.endDate = ret.endDate.toISOString().split("T")[0];
    return ret;
  }
});

module.exports = mongoose.model("jobs", JobSchema);
