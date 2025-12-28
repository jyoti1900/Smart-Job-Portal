const JobModel = require("../../database/models/Jobs");

exports.listJobForUsers = async (req, res) => {
  try {
    let { page = 1, perPage = 10 } = req.query;
    page = parseInt(page);
    perPage = parseInt(perPage);

    // ✅ SAFE QUERY (handles old + new jobs)
    const query = {
      deleted: { $ne: true },
      $or: [
        { status: "Active" },
        { status: { $exists: false } }
      ]
    };

    let data = await JobModel.find(query)
      .sort({ _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    // attach image url
    data = data.map(job => ({
      ...job,
      image: job.image
        ? `${req.protocol}://${req.get("host")}/public/${job.image}`
        : ""
    }));

    const count = await JobModel.countDocuments(query);

    return res.json({
      success: true,
      message: "Active jobs fetched successfully",
      data,
      count,
      page,
      perPage
    });

  } catch (err) {
    console.error("List jobs error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};


