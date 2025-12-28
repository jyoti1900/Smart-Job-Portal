const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const experienceYearSchema = new Schema(
  {
     year: {
      type: String,
      required: true,
      unique: true
    },
    deleted: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExperienceYear", experienceYearSchema);
