const UserModel = require('../models/users');
const {encryptPassword} = require('../../utility');

module.exports = async () => {
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminExists = await UserModel.findOne({email: adminEmail});
    if (!adminExists){
        await UserModel.create({
            email: adminEmail,
            password: encryptPassword(process.env.PASSWORD.toString()),
            user_type: 'admin'
        })
    } else {
        console.log("Admin exists in the system");
    }
}

