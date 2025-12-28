const mongoose = require("mongoose");
const Application = require("../../database/models/applyjobs");


exports.getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID missing"
      });
    }

    const applications = await Application.aggregate([
      {
        $match: {
          job: new mongoose.Types.ObjectId(jobId),
          deleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          status: 1,
          jobType: 1,
          appliedDate: 1,
          chatEnabled: 1,

          "userDetails._id": 1,
          "userDetails.name": 1,
          "userDetails.email": 1,
          "userDetails.mobile": 1,
          "userDetails.experience": 1,
          "userDetails.education": 1,
          "userDetails.profile_image": 1,
          "userDetails.document": 1
        }
      }
    ]);

    const data = applications.map(app => ({
      ...app,
      userDetails: {
        ...app.userDetails,
        profile_image: app.userDetails.profile_image
          ? `${req.protocol}://${req.get("host")}/public/${app.userDetails.profile_image}`
          : "",
        document: app.userDetails.document
          ? `${req.protocol}://${req.get("host")}/public/${app.userDetails.document}`
          : ""
      }
    }));

    return res.json({
      success: true,
      total: data.length,
      data
    });

  } catch (err) {
    console.error("getApplicantsForJob error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // ✅ Correct recruiterId access
    const recruiterId = req.userDetails?._id;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid applicationId"
      });
    }

    if (!["Selected", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const application = await Application.findOneAndUpdate(
      {
        _id: applicationId,
        deleted: false,
        ...(recruiterId && { recruiterId }) // ✅ apply only if exists
      },
      {
        status,
        chatEnabled: status === "Selected"
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found or unauthorized"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Candidate ${status}`,
      data: application
    });

  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
