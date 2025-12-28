const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const experienceMonthSchema = new Schema(
  {
     month: {
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

module.exports = mongoose.model("ExperienceMonth", experienceMonthSchema);
