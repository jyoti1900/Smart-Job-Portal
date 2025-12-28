const JobModel = require("../../database/models/Jobs");

// List Jobs (with pagination)
exports.listJob = async (req, res) => {
  try {
    let { page = 1, perPage = 10 } = req.query;
    page = parseInt(page);
    perPage = parseInt(perPage);

    const query = { deleted: { $ne: true } };

    let data = await JobModel.find(query)
      .populate("recruiterId", "name")
      .sort({ _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    data = data.map(job => ({
      ...job,

      recruiterName: job.recruiterId?.name || "N/A",

      // ✅ DATE ONLY FIX
      postDate: job.postDate
        ? new Date(job.postDate).toISOString().split("T")[0]
        : "",

      endDate: job.endDate
        ? new Date(job.endDate).toISOString().split("T")[0]
        : "",

      image: job.image
        ? `${req.protocol}://${req.get("host")}/public/${job.image}`
        : ""
    }));

    const count = await JobModel.countDocuments(query);

    return res.json({
      success: true,
      message: "Data fetched successfully",
      data,
      count
    });
  } catch (err) {
    console.error("listJob error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Delete Job (soft delete)
exports.deleteJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        await JobModel.findByIdAndUpdate(jobId, { deleted: true }, { new: true });
        res.json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};
