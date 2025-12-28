const RecruiterModel = require("../../database/models/recruiter");
const JobCatModel = require("../../database/models/job_categories");
const { encryptPassword } = require("../../utility");
const jwt = require("jsonwebtoken");

exports.recruiter_signup = async (req, res) => {
    try {
        // Check if email exists
        let userData = await RecruiterModel.findOne({ email: req.body.email });

        // Convert category name → ObjectId
        const category = await JobCatModel.findOne({ cat_name: req.body.workCat });
        if (!category) {
            return res.status(400).json({ success: false, message: "Invalid work category" });
        }
        const workCatId = category._id;

        // Reactivate deleted recruiter
        if (userData && userData.deleted) {
            userData.name = req.body.name;
            userData.empId = req.body.empId;
            userData.profile_image = req.file ? req.file.filename : userData.profile_image;
            userData.password = encryptPassword(req.body.password);
            userData.company = req.body.company;
            userData.mobile = req.body.mobile;
            userData.pin = req.body.pin;
            userData.address = req.body.address;
            userData.designation = req.body.designation;
            userData.workCat = workCatId;
            userData.user_type = "job_provider";
            userData.deleted = false;

            await userData.save();

            // Populate workCat before sending response
            userData = await RecruiterModel.findById(userData._id).populate("workCat", "cat_name");

            const token = jwt.sign({ id: userData._id }, process.env.KEY);

            return res.json({
                success: true,
                data: userData,
                token,
                message: "Recruiter reactivated successfully",
            });
        }

        // Email already active
        if (userData) {
            return res.status(409).json({ success: false, message: "This email already exists" });
        }

        // Create new recruiter
        let newUser = await RecruiterModel.create({
            name: req.body.name,
            empId: req.body.empId,
            profile_image: req.file ? req.file.filename : null,
            email: req.body.email,
            password: encryptPassword(req.body.password),
            bio: req.body.bio,
            company: req.body.company,
            workCat: workCatId,
            designation: req.body.designation,
            mobile: req.body.mobile,
            pin: req.body.pin,
            address: req.body.address,
            user_type: "job_provider",
            deleted: false,
        });

        // Populate workCat before sending response
        newUser = await RecruiterModel.findById(newUser._id).populate("workCat", "cat_name");

        const token = jwt.sign({ id: newUser._id }, process.env.KEY);

        res.json({
            success: true,
            data: newUser,
            token,
            message: "Registration successful",
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};
