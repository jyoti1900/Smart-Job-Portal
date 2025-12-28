const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const UserModel = require("../../database/models/users");
const EducationYearModel = require("../../database/models/education_date");
const ExperienceYearModel = require("../../database/models/experience_year");
const ExperienceMonthModel = require("../../database/models/experience_month");

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?._id || req.params.id || req.body.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID not provided or invalid token"
            });
        }

        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // ✅ Parse skillTag like project skillTag
        let skillTag = req.body.skillTag ?? existingUser.skillTag ?? [];
        if (typeof skillTag === "string") {
            try {
                const parsed = JSON.parse(skillTag);
                skillTag = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                skillTag = skillTag.split(",").map(s => s.trim());
            }
        }

        // ✅ Parse JSON arrays if sent as string
        const parseArray = (v, key) => {
            if (!v) return existingUser[key] || [];
            try { return JSON.parse(v); }
            catch { return existingUser[key] || []; }
        };

        const experience = parseArray(req.body.experience, "experience");
        const project = parseArray(req.body.project, "project");
        const certification = parseArray(req.body.certification, "certification");
        const education = parseArray(req.body.education, "education");

        const updatedData = {
            name: req.body.name || existingUser.name,
            title: req.body.title || existingUser.title,
            mobile: req.body.mobile || existingUser.mobile,
            address: req.body.address || existingUser.address,
            about: req.body.about || existingUser.about,
            skillTag, // ✅ clean skills!
            experience,
            project,
            certification,
            education
        };

        if (req.files?.profile_image)
            updatedData.profile_image = req.files.profile_image[0].filename;

        if (req.files?.document)
            updatedData.document = req.files.document[0].filename;

        const updatedUser = await UserModel.findByIdAndUpdate(userId, updatedData, { new: true });

        return res.json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });

    } catch (err) {
        console.error("Profile update error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

exports.listProfile = async (req, res) => {
  try {
    const { id } = req.params;

    let user = await UserModel.findOne({ _id: id, deleted: { $ne: true } })
      .populate("experience.start_date.month", "month")
      .populate("experience.start_date.year", "year")
      .populate("experience.end_date.month", "month")
      .populate("experience.end_date.year", "year")
      .populate("education.year", "passoutyear")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Profile image
    if (user.profile_image) {
      user.profile_image = `${req.protocol}://${req.get("host")}/public/${user.profile_image}`;
    }

    // Resume (document)
    if (user.document) {
      user.document = `${req.protocol}://${req.get("host")}/public/${user.document}`;
    }

    // Certification documents
    if (Array.isArray(user.certification)) {
      user.certification = user.certification.map(cert => {
        if (cert.document) {
          cert.document = `${req.protocol}://${req.get("host")}/public/${cert.document}`;
        }
        return cert;
      });
    }

    return res.json({
      success: true,
      message: "User fetched successfully",
      data: user
    });

  } catch (err) {
    console.error("List user by ID error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};


exports.addExperience = async (req, res) => {
    try {
        const { userId } = req.params;
        const data = req.body;

        const isPresent = data.present === true || data.present === "true";

        // ✅ Find start month/year
        const sMonth = await ExperienceMonthModel.findOne({ month: data.start_date.month });
        const sYear = await ExperienceYearModel.findOne({ year: data.start_date.year });

        if (!sMonth || !sYear) {
            return res.status(400).json({
                success: false,
                message: "Invalid start month/year selected"
            });
        }

        // ✅ Prepare newExp base
        const newExp = {
            role: data.role,
            company: data.company,
            start_date: {
                month: sMonth._id,
                year: sYear._id
            },
            present: isPresent,
            description: data.description,
            deleted: false,
            token: ""
        };

        // ✅ Only add end date if NOT present
        if (!isPresent) {
            const eMonth = await ExperienceMonthModel.findOne({ month: data.end_date.month });
            const eYear = await ExperienceYearModel.findOne({ year: data.end_date.year });

            if (!eMonth || !eYear) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid end month/year selected"
                });
            }

            newExp.end_date = {
                month: eMonth._id,
                year: eYear._id
            };
        } else {
            newExp.end_date = null; // ✅ clean end date
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $push: { experience: newExp } },
            { new: true }
        )
            .populate("experience.start_date.month", "month")
            .populate("experience.start_date.year", "year")
            .populate("experience.end_date.month", "month")
            .populate("experience.end_date.year", "year");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            message: "Experience added successfully",
            data: user.experience
        });

    } catch (err) {
        console.error("Add experience error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error, Experience not added",
            error: err.message
        });
    }
};

exports.updateExperience = async (req, res) => {
    try {
        const { userId, experienceId } = req.params;
        let data = req.body;

        // Parse JSON if needed (form-data case)
        if (typeof data === "string") {
            try { data = JSON.parse(data); } catch {}
        }

        if (!data.role || !data.company || !data.start_date) {
            return res.status(400).json({
                success: false,
                message: "Role, company and start date are required"
            });
        }

        // ✅ Present check
        const isPresent =
            data.present === true ||
            data.present === "true" ||
            data.end_date === "Present" ||
            data.end_date?.present === true;

        // ✅ Validate + Fetch Start Date
        const sMonth = await ExperienceMonthModel.findOne({ month: data.start_date.month });
        const sYear = await ExperienceYearModel.findOne({ year: data.start_date.year });

        if (!sMonth || !sYear) {
            return res.status(400).json({
                success: false,
                message: "Invalid start month/year selected"
            });
        }

        let eMonth = null, eYear = null;

        // ✅ Fetch end date ONLY if not present
        if (!isPresent && data.end_date?.month && data.end_date?.year) {
            eMonth = await ExperienceMonthModel.findOne({ month: data.end_date.month });
            eYear = await ExperienceYearModel.findOne({ year: data.end_date.year });

            if (!eMonth || !eYear) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid end month/year selected"
                });
            }
        }

        const updateData = {
            "experience.$.role": data.role,
            "experience.$.company": data.company,
            "experience.$.start_date": { month: sMonth._id, year: sYear._id },
            "experience.$.present": isPresent,
            "experience.$.description": data.description || ""
        };

        // ✅ If present, remove end_date
        if (isPresent) {
            updateData["experience.$.end_date"] = null;
        } else {
            updateData["experience.$.end_date"] = {
                month: eMonth?._id,
                year: eYear?._id
            };
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId, "experience._id": experienceId },
            { $set: updateData },
            { new: true }
        )
            .populate("experience.start_date.month", "month")
            .populate("experience.start_date.year", "year")
            .populate("experience.end_date.month", "month")
            .populate("experience.end_date.year", "year");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Experience not found"
            });
        }

        return res.json({
            success: true,
            message: "Experience updated successfully",
            data: updatedUser.experience
        });

    } catch (err) {
        console.error("Update experience error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

exports.deleteExperience = async (req, res) => {
    try {
        const { userId, experienceId } = req.params;

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $pull: { experience: { _id: experienceId } } },
            { new: true }
        )
            .populate("experience.start_date.month experience.start_date.year")
            .populate("experience.end_date.month experience.end_date.year");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Experience not found"
            });
        }

        res.json({
            success: true,
            message: "Experience entry deleted successfully",
            data: updatedUser.experience
        });
    } catch (err) {
        console.error("Delete experience error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Experience not deleted",
            error: err.message
        });
    }
};

exports.addProject = async (req, res) => {
    try {
        const { userId } = req.params;
        const data = req.body;

        // skillTag ALWAYS array → form-data comes as string → parse
        if (typeof data.skillTag === "string") {
            try {
                data.skillTag = JSON.parse(data.skillTag); // ["React","Node.js"]
            } catch {
                data.skillTag = [data.skillTag]; // React
            }
        }

        const newProject = {
            projectName: data.projectName || "",
            brief: data.brief || "",
            link: data.link || "",
            skillTag: data.skillTag || [],
            deleted: false,
            token: ""
        };

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $push: { project: newProject } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            message: "Project added successfully",
            data: updatedUser.project
        });
    } catch (err) {
        console.error("Add project error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error, project not added",
            error: err.message
        });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { userId, projectId } = req.params;
        const data = req.body;

        // Ensure skillTag is an array
        if (typeof data.skillTag === "string") {
            try {
                data.skillTag = JSON.parse(data.skillTag);
            } catch {
                data.skillTag = [data.skillTag];
            }
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId, "project._id": projectId },
            {
                $set: {
                    "project.$.projectName": data.projectName || "",
                    "project.$.brief": data.brief || "",
                    "project.$.link": data.link || "",
                    "project.$.skillTag": data.skillTag || [],
                    "project.$.deleted": data.deleted ?? false,
                    "project.$.token": data.token || ""
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project updated successfully",
            data: updatedUser.project
        });
    } catch (err) {
        console.error("Update project error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Project not updated",
            error: err.message
        });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { userId, projectId } = req.params;

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $pull: { project: { _id: projectId } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project permanently deleted from database",
            data: updatedUser.project
        });
    } catch (err) {
        console.error("Delete project error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Project not deleted",
            error: err.message
        });
    }
};

exports.addCertification = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body || {};

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // cleanup uploaded file if present
      if (req.file) {
        fs.unlink(path.join(__dirname, "..", "public", "uploads", req.file.filename), () => {});
      }
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    // file is in req.file
    const documentFilename = req.file ? req.file.filename : "";

    // Normalize skillTag to always be an array of trimmed strings
    let skillTag = [];
    if (Array.isArray(data.skillTag)) {
      skillTag = data.skillTag.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof data.skillTag === "string" && data.skillTag.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(data.skillTag);
        if (Array.isArray(parsed)) skillTag = parsed.map(s => String(s).trim()).filter(Boolean);
      } catch (e) {
        skillTag = [];
      }
    } else if (typeof data.skillTag === "string" && data.skillTag.trim().length) {
      skillTag = data.skillTag.split(",").map(s => s.trim()).filter(Boolean);
    }

    const newCertification = {
      certificationName: data.certificationName || "",
      learned: data.learned || "",
      link: data.link || "",
      skillTag,
      document: documentFilename,
      deleted: false,
      token: req.headers.authorization ? req.headers.authorization.split(" ")[1] : ""
    };

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { certification: newCertification } },
      { new: true }
    );

    if (!user) {
      // cleanup uploaded file to avoid orphan
      if (req.file) {
        fs.unlink(path.join(__dirname, "..", "public", "uploads", req.file.filename), () => {});
      }
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // optional: build full URL for the uploaded document so frontend can use it directly
    const lastCert = user.certification[user.certification.length - 1];
    const documentUrl = lastCert.document
      ? `${req.protocol}://${req.get("host")}/public/uploads/${lastCert.document}`
      : "";

    return res.json({
      success: true,
      message: "Certification added",
      data: user.certification,
      documentUrl // helpful for immediate UI update
    });
  } catch (err) {
    // cleanup on error
    if (req.file) {
      try {
        fs.unlink(path.join(__dirname, "..", "public", "uploads", req.file.filename), () => {});
      } catch (e) {}
    }
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal error", error: err.message });
  }
};


exports.updateCertification = async (req, res) => {
    try {
        const { userId, certificationId } = req.params;
        let updateData = req.body;

        // skillTag always STRING in form-data → convert to array
        if (updateData.skillTag) {
            try {
                updateData.skillTag = JSON.parse(updateData.skillTag);
            } catch {
                updateData.skillTag = [updateData.skillTag];
            }
        } else {
            updateData.skillTag = [];
        }

        // handle uploaded file if coming (multer upload)
        if (req.file) {
            updateData.document = req.file.filename; // or full url if needed
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId, "certification._id": certificationId },
            {
                $set: {
                    "certification.$.certificationName": updateData.certificationName || "",
                    "certification.$.learned": updateData.learned || "",
                    "certification.$.link": updateData.link || "",
                    "certification.$.skillTag": updateData.skillTag,
                    "certification.$.document": updateData.document || ""
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Certification not found"
            });
        }

        res.json({
            success: true,
            message: "Certification updated successfully",
            data: updatedUser.certification
        });
    } catch (err) {
        console.error("Update certification error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Certification not updated",
            error: err.message
        });
    }
};

exports.deleteCertification = async (req, res) => {
    try {
        const { userId, certificationId } = req.params;

        // Pull (remove) the certification object that matches the given certificationId
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $pull: { certification: { _id: certificationId } } },
            { new: true } // return updated user document
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Certification not found"
            });
        }

        res.json({
            success: true,
            message: "Certification entry deleted successfully",
            data: updatedUser.certification
        });
    } catch (err) {
        console.error("Delete certification error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Certification not deleted",
            error: err.message
        });
    }
};

exports.addEducation = async (req, res) => {
    try {
        const { userId } = req.params;
        let data = req.body;

        if (typeof data === "string") {
            try { data = JSON.parse(data); } catch (err) {}
        }

        const { degree, institution, year } = data;

        if (!degree || !institution || !year) {
            return res.status(400).json({
                success: false,
                message: "Degree, Institution and Year are required"
            });
        }

        // ✅ Find year document directly including Pursuing
        const yearDoc = await EducationYearModel.findOne({ passoutyear: year });

        if (!yearDoc) {
            return res.status(400).json({
                success: false,
                message: "Invalid passout year"
            });
        }

        const newEdu = {
            degree,
            institution,
            year: yearDoc._id
        };

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $push: { education: newEdu } },
            { new: true }
        ).populate("education.year", "passoutyear");

        res.json({
            success: true,
            message: "Education added successfully",
            data: updatedUser.education
        });

    } catch (error) {
        console.error("Add Education Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.updateEducation = async (req, res) => {
    try {
        const { userId, educationId } = req.params;
        let data = req.body;

        if (typeof data === "string") {
            try { data = JSON.parse(data); } catch (err) {}
        }

        const { degree, institution, year } = data;

        if (!degree || !institution || !year) {
            return res.status(400).json({
                success: false,
                message: "Degree, Institution and Year are required"
            });
        }

        // ✅ Same lookup for "Pursuing"
        const yearDoc = await EducationYearModel.findOne({ passoutyear: year });

        if (!yearDoc) {
            return res.status(400).json({
                success: false,
                message: "Invalid passout year"
            });
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId, "education._id": educationId },
            {
                $set: {
                    "education.$.degree": degree,
                    "education.$.institution": institution,
                    "education.$.year": yearDoc._id
                }
            },
            { new: true }
        ).populate("education.year", "passoutyear");

        res.json({
            success: true,
            message: "Education updated successfully",
            data: updatedUser.education
        });

    } catch (error) {
        console.error("Update Education Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.deleteEducation = async (req, res) => {
    try {
        const { userId, educationId } = req.params;

        // remove the education
        await UserModel.findByIdAndUpdate(userId, { $pull: { education: { _id: educationId } } });

        // re-fetch with populate to show year name + id
        const updatedUser = await UserModel.findById(userId).populate("education.year");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User or Education not found"
            });
        }

        res.json({
            success: true,
            message: "Education entry deleted successfully",
            data: updatedUser.education
        });
    } catch (err) {
        console.error("Delete education error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Education not deleted",
            error: err.message
        });
    }
};

exports.deleteResume = async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // check if resume exists
    const resumeFile = user.document;
    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: "No resume found to delete"
      });
    }

    // remove file from /public/ folder
    const filePath = path.join(__dirname, "..", "public", resumeFile);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // delete file
    }

    // remove resume from DB
    user.document = "";
    await user.save();

    return res.json({
      success: true,
      message: "Resume deleted successfully",
      data: user
    });

  } catch (err) {
    console.error("Delete resume error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error, Resume not deleted",
      error: err.message
    });
  }
};


