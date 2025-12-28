const UserModel = require('../../database/models/users');
const { encryptPassword } = require('../../utility');
const jwt = require('jsonwebtoken');

exports.user_signup = async (req, res) => {
    try {
        let userData = await UserModel.findOne({ email: req.body.email });

        if (userData && !userData.deleted) {
            // Already active user
            return res.status(409).json({
                success: false,
                message: "This email already exists"
            });
        }

        const spassword = encryptPassword(req.body.password);

        if (userData && userData.deleted) {
            // Reactivate the deleted user
            userData.name = req.body.name;
            userData.password = spassword;
            userData.mobile = req.body.mobile;
            userData.address = req.body.address;
            userData.user_type = "job_seeker";
            userData.deleted = false;

            await userData.save();

            const token = jwt.sign({ data: userData }, process.env.KEY);
            return res.json({
                success: true,
                data: userData,
                token: token,
                message: "Account restored successfully"
            });
        }

        // Create new user
        const newUser = await UserModel.create({
            name: req.body.name,
            email: req.body.email,
            password: spassword,
            mobile: req.body.mobile,
            address: req.body.address,
            user_type: "job_seeker",
            deleted: false
        });

        const token = jwt.sign({ data: newUser }, process.env.KEY);
        res.json({
            success: true,
            data: newUser,
            token: token,
            message: "Registration successful"
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error",
            error: err
        });
    }
};
