const mongoose = require("mongoose");
const RecruiterModel = require("../../database/models/recruiter");
const JobModel = require("../../database/models/Jobs"); // make sure this path is correct

// POST /api/v1/recruiter/jobs
exports.addJob = async (req, res) => {
  try {
    const recruiterId = req.userDetails?.data?._id;
    const userType = req.userDetails?.data?.user_type;

    if (!recruiterId || userType !== "job_provider") {
      return res.status(403).json({ success: false, message: "Only recruiters can add jobs" });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Job image is required"
      });
    }

    const recruiter = await RecruiterModel.findOne({
      _id: recruiterId,
      deleted: { $ne: true }
    });

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    const skillsArray = Array.isArray(req.body.skills)
      ? req.body.skills
      : String(req.body.skills).split(",").map(s => s.trim()).filter(Boolean);

    const job = await JobModel.create({
      recruiterId,
      title: req.body.title,
      company: recruiter.company,
      cat_name: req.body.cat_name,
      endDate: new Date(req.body.endDate),
      experience: req.body.experience,
      education: req.body.education,
      salary: req.body.salary,
      jobType: req.body.jobType,
      location: req.body.location,
      image: req.file.filename,
      description: req.body.description,
      skills: skillsArray,
      education: req.body.education || ""
    });

    res.status(201).json({
      success: true,
      message: "Job added successfully",
      data: job
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// PUT /api/v1/recruiter/jobs/:jobId
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.userDetails?.data?._id;
    const userType = req.userDetails?.data?.user_type;

    if (userType !== "job_provider") {
      return res.status(403).json({
        success: false,
        message: "Only recruiters can update jobs"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId"
      });
    }

    const job = await JobModel.findOne({
      _id: jobId,
      deleted: { $ne: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (String(job.recruiterId) !== String(recruiterId)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    const {
      title,
      description,
      company,
      cat_name,
      experience,
      salary,
      jobType,
      location,
      education,
      skills,
      endDate,
      status
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title;
    if (company) updateData.company = company;
    if (description) updateData.description = description;
    if (cat_name) updateData.cat_name = cat_name;
    if (experience) updateData.experience = experience;
    if (salary) updateData.salary = salary;
    if (jobType) updateData.jobType = jobType;
    if (location) updateData.location = location;
    if (education !== undefined) updateData.education = education;

    // skills
    if (skills) {
      updateData.skills = Array.isArray(skills)
        ? skills.map(s => s.trim())
        : String(skills).split(",").map(s => s.trim());
    }

    // endDate
    if (endDate) {
      const parsedDate = new Date(endDate);
      if (isNaN(parsedDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid endDate format"
        });
      }
      updateData.endDate = parsedDate;
    }

    // ✅ STATUS (ONLY PLACE)
    if (status !== undefined) {
      if (!["Active", "Closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }
      updateData.status = status;
    }

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedJob = await JobModel.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// GET /api/v1/recruiter/jobs
exports.listMyJobs = async (req, res) => {
  try {
    const recruiterId = req.userDetails?.data?._id;

    const matchStage = {
      recruiterId: new mongoose.Types.ObjectId(recruiterId),
      deleted: { $ne: true }
    };

    const jobs = await JobModel.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "applications", // collection name of Application model
          localField: "_id",
          foreignField: "job",
          as: "applications"
        }
      },

      {
        $addFields: {
          jobAppliedCount: { $size: "$applications" }
        }
      },

      {
        $project: {
          title: 1,
          skills: 1,
          description: 1,
          company: 1,
          cat_name: 1,
          postDate: 1,
          endDate: 1,
          experience: 1,
          education: 1,
          salary: 1,
          status: 1,
          jobType: 1,
          location: 1,
          image: 1,
          jobAppliedCount: 1
        }
      }
    ]);

    const data = jobs.map(job => ({
      ...job,
      image: job.image
        ? `${req.protocol}://${req.get("host")}/public/${job.image}`
        : ""
    }));

    return res.json({
      success: true,
      message: "Jobs fetched successfully",
      total: data.length,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// DELETE /api/v1/recruiter/jobs/:jobId
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.userDetails?.data?._id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }

    const job = await JobModel.findOne({ _id: jobId, deleted: { $ne: true } });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (String(job.recruiterId) !== String(recruiterId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    job.deleted = true;
    await job.save();

    res.json({
      success: true,
      message: "Job deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

