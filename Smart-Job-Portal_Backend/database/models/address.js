const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    housename: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    address_type: {
        type: String,
        required: true,
    },
    default: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("address", AddressSchema);
