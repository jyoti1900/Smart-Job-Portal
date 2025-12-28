const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const educationYearSchema = new Schema(
  {
    passoutyear: {
      type: String,
      required: true,
      unique: true
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EducationYear", educationYearSchema);
