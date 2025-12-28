const UserModel = require('../../database/models/users');
const {decryptPassword} = require('../../utility');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {

    let { email, password } = req.body;

    const userDetails = await UserModel.findOne({email: email});

    if (userDetails) {
        let pwd = decryptPassword(userDetails.password);

        if (password.toString() === pwd) {
            const token = jwt.sign({data: userDetails}, process.env.KEY);
            res.json({ success: true, data: userDetails, token: token, message: "Login successful" });

        } else {
            res.json({ success: false, data: null, message: 'Wrong password', errCode: 2 });
        }
    } else {
        res.status(400).send({
            success: false,
            data: null,
            message: "Email ID does not exists",
            errCode: 1
        });
    }
}


