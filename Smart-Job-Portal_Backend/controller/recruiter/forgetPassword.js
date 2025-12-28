const RecruiterModel = require("../../database/models/recruiter");
const { encryptPassword } = require("../../utility");
require("dotenv").config();
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const sendresetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: `"KaajKhojo Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "For Reset Password",
            html: `
        <p>Hi ${name},</p>
        <p>You requested to reset your password.</p>
        <p>Please click the link below to reset it:</p>
        <a href="http://localhost:3000/ResetPassword?token=${token}">
            Reset your password
        </a>
        <br/><br/>
        <p>If you did not request this, you can safely ignore this email.</p>
    `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Mail has been sent: ", info.response);
            }
        });
    } catch (error) {
        console.log("Error in sending mail:", error);
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const userData = await RecruiterModel.findOne({ email: req.body.email });

        if (userData) {
            const token = randomstring.generate();
            await RecruiterModel.updateOne({ email: req.body.email }, { $set: { token: token } });
            await sendresetPasswordMail(userData.name, userData.email, token);

            res.status(200).json({
                success: true,
                token: token,
                message: "Please check your inbox to reset your password"
            });
        } else {
            res.status(404).json({
                success: false,
                data: null,
                message: "This email does not exist"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error",
            error: error.message
        });
    }
};

// controller
exports.resetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await RecruiterModel.findOne({ token: token });

        if (tokenData) {
            const password = req.body.password;
            const newPassword = encryptPassword(password);
            const userData = await RecruiterModel.findByIdAndUpdate(
                { _id: tokenData._id },
                { $set: { password: newPassword, token: "" } },
                { new: true }
            );
            res.status(200).json({
                success: true,
                data: userData,
                message: "User Password has been reset"
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: "This link has been expired" 
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error",
            error: error.message
        });
    }
};
