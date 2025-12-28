// controller/customer/application.js
const Application = require("../../database/models/applyjobs");
const JobModel = require("../../database/models/Jobs"); // change path/name if needed

// POST /api/v1/customer/apply-job
exports.applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.userDetails?.data?._id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId is required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    // 🔍 Find job to get recruiterId
    const job = await JobModel.findById(jobId).select("recruiterId");

    if (!job || !job.recruiterId) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found for this job"
      });
    }

    // 🚫 Prevent duplicate apply
    const existing = await Application.findOne({
      user: userId,
      job: jobId,
      deleted: { $ne: true }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job"
      });
    }

    // ✅ CREATE APPLICATION WITH recruiterId
    const application = await Application.create({
      user: userId,
      job: jobId,
      recruiterId: job.recruiterId, // ✅ KEY LINE
      status: "Applied",
      chatEnabled: false
    });

    return res.status(201).json({
      success: true,
      message: "Job applied successfully",
      data: application
    });

  } catch (err) {
    console.error("Apply job error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET /api/v1/customer/applications/:userId
exports.listUserApplications = async (req, res) => {
  try {
    const userId = req.userDetails?.data?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const apps = await Application.find({ user: userId })
      // ✅ Include multiple possible company fields
      .populate("job", "title company companyName jobType")
      .sort({ appliedDate: -1 })
      .lean();

    const formatted = apps.map((app) => ({
      id: app._id,

      jobName: app.job?.title || "N/A",

      // ✅ FIXED COMPANY MAPPING
      company:
        app.job?.company ||
        app.job?.companyName ||
        app.job?.company_name ||
        "N/A",

      status: app.status,

      appliedDate: app.appliedDate.toISOString().split("T")[0],

      jobType:
        app.jobType || app.job?.jobType || "N/A",

      chatEnabled: app.chatEnabled || false,
    }));

    return res.json({
      success: true,
      message: "Applications fetched successfully",
      total: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("List user applications error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



