const UserModel = require("../../database/models/users");
// const GoogleUserModel = require("../../database/models/googleUser");
const ApplicantModel = require("../../database/models/applyjobs");
const JobModel = require("../../database/models/Jobs");
const RecruiterModel = require("../../database/models/recruiter");
const JobCategory = require("../../database/models/job_categories");

// User Growth by Month
exports.getUserGrowth = async (req, res) => {
  try {
    // Aggregate normal users
    const userGrowth = await UserModel.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Merge both results
    const monthCounts = {};

    userGrowth.forEach(item => {
      const month = Number(item._id); // ensure number
      monthCounts[month] = (monthCounts[month] || 0) + item.count;
    });

    // Format into chart-friendly data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formatted = months.map((name, index) => ({
      month: name,
      users: monthCounts[index + 1] || 0 // add 1 because month numbers start at 1
    }));

    res.json({ success: true, data: formatted });

  } catch (err) {
    console.error("Error in getUserGrowth:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch user growth" });
  }
};

exports.getJobCategory = async (req, res) => {
  try {
    // ✅ 1. Get all categories (only those not deleted)
    const allCategories = await JobCategory.find(
      { deleted: { $ne: true } },
      { cat_name: 1 }
    ).lean();

    // ✅ 2. Aggregate job counts by category name
    const jobsByCategory = await JobModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$cat_name", "Uncategorized"] },
          count: { $sum: 1 },
        },
      },
    ]);

    // ✅ 3. Build a lookup map for fast access
    const jobCountMap = {};
    jobsByCategory.forEach((item) => {
      jobCountMap[item._id] = item.count;
    });

    // ✅ 4. Merge all categories with counts (default 0)
    const formatted = allCategories.map((cat) => ({
      name: cat.cat_name,
      value: jobCountMap[cat.cat_name] || 0,
    }));

    // ✅ 5. Add "Uncategorized" if exists in jobs but not in category list
    if (jobCountMap["Uncategorized"]) {
      formatted.push({
        name: "Uncategorized",
        value: jobCountMap["Uncategorized"],
      });
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Error in getJobCategory:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch job categories" });
  }
};

// Dashboard Overview
exports.getDashboardStats = async (req, res) => {
  try {
    const [users, recruiters, applications, jobs] =
      await Promise.all([
        UserModel.countDocuments({ deleted: { $ne: true } }),
        RecruiterModel.countDocuments({ deleted: { $ne: true } }),
        ApplicantModel.countDocuments({ deleted: { $ne: true } }),
        JobModel.countDocuments({ deleted: { $ne: true } }),
      ]);

    res.json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        users: users,
        recruiters,
        applications,
        jobs,
      },
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
