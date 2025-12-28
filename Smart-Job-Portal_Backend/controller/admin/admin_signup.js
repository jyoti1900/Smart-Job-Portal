const UserModel = require('../../database/models/users');
const { encryptPassword } = require('../../utility');
const jwt = require('jsonwebtoken');

exports.admin_signup = async (req, res) => {

    try {
        const userData = await UserModel.findOne({ email: req.body.email });
        if (userData) {
            return res.status(409).json({
                success: false,
                message: "This email is already exists"
            });
        }
        const spassword = encryptPassword(req.body.password);

        const newUser = await UserModel.create({
            name: req.body.name,
            email: req.body.email,
            password: spassword,
            mobile: req.body.mobile,
            address: req.body.address,
            user_type: "admin"
        });
        const token = jwt.sign({data: newUser}, process.env.KEY);
        res.json({ 
            success: true,
            data: newUser, 
            token: token,
            message: "Registration succesfull"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error",
            error: err
        });
    }
};