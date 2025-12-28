const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const RecruiterModel = require("../../database/models/recruiter");

exports.updateRecruiterProfile = async (req, res) => {
  try {
    const recruiterId = req.user?._id || req.params.id || req.body.id;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recruiter ID"
      });
    }

    const recruiter = await RecruiterModel.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    // ✅ Skill tags parsing
    let skillTag = recruiter.skillTag;
    if (req.body.skillTag !== undefined) {
      if (Array.isArray(req.body.skillTag)) {
        skillTag = req.body.skillTag;
      } else if (typeof req.body.skillTag === "string") {
        try {
          skillTag = JSON.parse(req.body.skillTag);
        } catch {
          skillTag = req.body.skillTag.split(",").map(s => s.trim());
        }
      }
    }

    // ❗ Do NOT overwrite experience/education here
    // They have their own APIs

    const updatedData = {
      name: req.body.name ?? recruiter.name,
      company: req.body.company ?? recruiter.company,
      designation: req.body.designation ?? recruiter.designation,
      mobile: req.body.mobile ?? recruiter.mobile,
      pin: req.body.pin ?? recruiter.pin,
      address: req.body.address ?? recruiter.address,
      bio: req.body.bio ?? recruiter.bio,
      skillTag
    };

    // ✅ Profile image
    if (req.files?.profile_image?.length) {
      updatedData.profile_image = req.files.profile_image[0].filename;
    }

    const updatedRecruiter = await RecruiterModel.findByIdAndUpdate(
      recruiterId,
      { $set: updatedData },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Recruiter profile updated successfully",
      data: updatedRecruiter
    });

  } catch (err) {
    console.error("Recruiter Profile update error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

exports.listRecruiterProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ ObjectId validation (CRITICAL)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recruiter ID"
      });
    }

    const recruiter = await RecruiterModel.findOne({
      _id: id,
      deleted: { $ne: true }
    })
      // ✅ ONLY populate ObjectId fields
      .populate("workCat", "cat_name")
      .lean();

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    // ✅ Profile image full URL
    if (recruiter.profile_image) {
      recruiter.profile_image = `${req.protocol}://${req.get("host")}/public/${recruiter.profile_image}`;
    }

    // ✅ Normalize experience "present"
    if (Array.isArray(recruiter.experience)) {
      recruiter.experience = recruiter.experience.map(exp => {
        if (exp.present === true) {
          exp.end_date = { present: true };
        }
        return exp;
      });
    }

    return res.json({
      success: true,
      message: "Recruiter profile fetched successfully",
      data: recruiter
    });

  } catch (err) {
    console.error("List Recruiter Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

exports.addRecruiterExperience = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const data = req.body;

    if (!data.role || !data.company || !data.start_date?.month || !data.start_date?.year) {
      return res.status(400).json({
        success: false,
        message: "Role, company, start month and start year are required"
      });
    }

    const isPresent = data.present === true || data.present === "true";

    const newExp = {
      role: data.role,
      company: data.company,
      start_date: {
        month: String(data.start_date.month),
        year: String(data.start_date.year)
      },
      end_date: isPresent
        ? null
        : {
            month: String(data.end_date?.month || ""),
            year: String(data.end_date?.year || "")
          },
      present: isPresent,
      description: data.description || "",
      deleted: false,
      token: ""
    };

    const recruiter = await RecruiterModel.findByIdAndUpdate(
      recruiterId,
      { $push: { experience: newExp } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Experience added successfully",
      data: recruiter.experience
    });

  } catch (err) {
    console.error("Add recruiter experience error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.updateRecruiterExperience = async (req, res) => {
  try {
    const { recruiterId, experienceId } = req.params;
    const data = req.body;

    if (!data.role || !data.company || !data.start_date?.month || !data.start_date?.year) {
      return res.status(400).json({
        success: false,
        message: "Role, company and start date are required"
      });
    }

    const isPresent = data.present === true || data.present === "true";

    const updateData = {
      "experience.$.role": data.role,
      "experience.$.company": data.company,
      "experience.$.start_date": {
        month: String(data.start_date.month),
        year: String(data.start_date.year)
      },
      "experience.$.present": isPresent,
      "experience.$.description": data.description || ""
    };

    updateData["experience.$.end_date"] = isPresent
      ? null
      : {
          month: String(data.end_date?.month || ""),
          year: String(data.end_date?.year || "")
        };

    const recruiter = await RecruiterModel.findOneAndUpdate(
      { _id: recruiterId, "experience._id": experienceId },
      { $set: updateData },
      { new: true }
    );

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Experience not found"
      });
    }

    return res.json({
      success: true,
      message: "Experience updated successfully",
      data: recruiter.experience
    });

  } catch (err) {
    console.error("Update recruiter experience error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.deleteRecruiterExperience = async (req, res) => {
  try {
    const { recruiterId, experienceId } = req.params;

    const recruiter = await RecruiterModel.findByIdAndUpdate(
      recruiterId,
      { $pull: { experience: { _id: experienceId } } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Experience removed successfully",
      data: recruiter.experience
    });

  } catch (err) {
    console.error("Delete recruiter experience error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.addRecruiterEducation = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const { degree, institution, year } = req.body;

    if (!degree || !institution || !year) {
      return res.status(400).json({
        success: false,
        message: "Degree, Institution and Year are required"
      });
    }

    const newEdu = {
      degree,
      institution,
      year: String(year), // STRING as per schema
      deleted: false,
      token: ""
    };

    const recruiter = await RecruiterModel.findByIdAndUpdate(
      recruiterId,
      { $push: { education: newEdu } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Education added successfully",
      data: recruiter.education
    });

  } catch (err) {
    console.error("Add recruiter education error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.updateRecruiterEducation = async (req, res) => {
  try {
    const { recruiterId, educationId } = req.params;
    const { degree, institution, year } = req.body;

    if (!degree || !institution || !year) {
      return res.status(400).json({
        success: false,
        message: "Degree, Institution and Year are required"
      });
    }

    const recruiter = await RecruiterModel.findOneAndUpdate(
      { _id: recruiterId, "education._id": educationId },
      {
        $set: {
          "education.$.degree": degree,
          "education.$.institution": institution,
          "education.$.year": String(year)
        }
      },
      { new: true }
    );

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Education not found"
      });
    }

    return res.json({
      success: true,
      message: "Education updated successfully",
      data: recruiter.education
    });

  } catch (err) {
    console.error("Update recruiter education error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.deleteRecruiterEducation = async (req, res) => {
  try {
    const { recruiterId, educationId } = req.params;

    await RecruiterModel.findByIdAndUpdate(
      recruiterId,
      { $pull: { education: { _id: educationId } } }
    );

    const recruiter = await RecruiterModel.findById(recruiterId);

    return res.json({
      success: true,
      message: "Education deleted successfully",
      data: recruiter.education
    });

  } catch (err) {
    console.error("Delete recruiter education error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



