const mongoose = require("mongoose");
const ApplicationModel = require("../../database/models/applyjobs");

// List Applicants (with pagination + category)
exports.listApplicants = async (req, res) => {
  try {
    let { page = 1, perPage = 5 } = req.query;
    page = parseInt(page);
    perPage = parseInt(perPage);

    const query = {}; // add deleted filter if needed

    const [count, apps] = await Promise.all([
      ApplicationModel.countDocuments(query),
      ApplicationModel.find(query)
        .populate("user", "name")
        .populate("job", "title cat_name company")
        .populate("recruiterId", "name") // ✅ KEY FIX
        .sort({ appliedDate: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean(),
    ]);

    const rows = apps.map((app) => ({
      _id: app._id.toString(),
      userName: app.user?.name || "N/A",
      jobTitle: app.job?.title || "N/A",
      jobCategory: app.job?.cat_name || "N/A",
      companyName: app.job?.company || "N/A",
      applyDate: app.appliedDate
        ? app.appliedDate.toISOString().split("T")[0]
        : "",
      recruiterName: app.recruiterId?.name || "N/A", // ✅ FIXED
    }));

    return res.json({
      success: true,
      message: "Applicants fetched successfully",
      data: rows,
      count,
    });
  } catch (err) {
    console.error("List applicants error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete Applicant (soft delete + still show cat_name if needed)
exports.deleteApplicant = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;   // 👈 matches URL :id

    console.log("Delete applicantId:", applicantId);

    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: "applicantId is required in URL",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid applicantId format",
      });
    }

    // HARD DELETE (permanent)
    const deleted = await ApplicationModel.findByIdAndDelete(applicantId)
      .populate("user", "name")
      .populate("job", "title cat_name company recruiter");

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    return res.json({
      success: true,
      message: "Applicant deleted successfully",
    });
  } catch (err) {
    console.error("Delete Applicant Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

