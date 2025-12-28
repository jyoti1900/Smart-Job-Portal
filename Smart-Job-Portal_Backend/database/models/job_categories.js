const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobCategoriesSchema = new Schema(
  {
    cat_name: {
      type: String,
      required: true,
      unique: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobCategory", jobCategoriesSchema);
