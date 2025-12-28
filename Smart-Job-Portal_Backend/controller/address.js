const AddressModel = require("../database/models/address");
const mongoose = require("mongoose");


exports.addressCreate = async (req, res) => {
    try {
        
        await AddressModel.create({
            user_id: req.userDetails.data._id,
            housename:req.body.housename,
            city:req.body.city,
            state:req.body.state,
            phone:req.body.phone,
            pincode:req.body.pincode,
            address_type:req.body.address_type,
            default:req.body.default,
            user_type: "customer"
        });

       res.json({
        success: true,
        message: "Data inserted successfully"
       }); 
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err
        });
        
    }
};

exports.listAddress = async (req, res) => {
    try{
        const data = await AddressModel.find({
            user_id : req.userDetails.data._id,
            deleted: false
        }).sort({_id: -1})
        res.json({
            success: true,
            message: "Data fetched successfully",
            data: data
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err,
        });
    }
};


exports.updateAddress = async (req, res) => {
    try {
        const _id = req.params._id;

        let updatedData = {
            housename:req.body.housename,
            city:req.body.city,
            state:req.body.state,
            phone:req.body.phone,
            pincode:req.body.pincode,
            addressType:req.body.addressType,
            isDefault:req.body.isDefault,
        }
        const result = await AddressModel.findByIdAndUpdate(_id, updatedData);
        if(result){
        res.json({
            success: true,
            message: "Data updated successfully"
        }); 
    }else{
        res.json({
            success: false,
            message: "Data not found",
        });
    }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Data not Update",
            error:err
        });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const _id = req.params._id; 
        await AddressModel.findByIdAndUpdate(_id, {deleted: true});
         {
            res.json({
                success: true,
                message: "Address Information deleted successfully",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error, Address not deleted",
            error: err,
        });
    }
};
