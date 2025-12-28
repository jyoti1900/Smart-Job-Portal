const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SlotsSchema = new Schema({

    slotDate: {
        type: Date, // date in ISO format with start time
        required: true
    },
    timeStart: {
        type: String, // eg: 07:00 pm
        required: true
    },
    startTimestamp: {
        type: Number, // unix timestamp (miliseconds)
        required: true
    },
    endTimestamp: {
        type: Number, // unix timestamp (miliseconds)
        required: true
    },
    duration: {
        type: Number, // in minute
        default: 60
    },
    adId: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: 'ads'
    },
    specialSlot: {
        type: Boolean,
        default: false
    },
    displayed: {
        type: Boolean,
        default: false
    },
    deleted:{
        type: Boolean,
        default: false
    },

}, {timestamps: true});

module.exports = mongoose.model('slots', SlotsSchema);