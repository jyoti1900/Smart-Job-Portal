const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecruiterSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        empId: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        bio: {
            type: String,
            default: ""
        },
        company: {
            type: String,
            required: true
        },
        workCat: {
            type: Schema.Types.ObjectId,
            ref: 'JobCategory',
            required: true
        },
        designation: {
            type: String,
            required: true
        },
        user_type: {
            type: String,
            enum: ["job_provider"],
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        profile_image: {
            type: String,
            default: ""
        },
        pin: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        designation: {
            type: String,
            required: true
        },
        skillTag: {
            type: [String],
            default: []
        },
        experience: [
            {
                role: {
                    type: String,
                    default: ""
                },
                company: {
                    type: String,
                    default: ""
                },
                start_date: {
                    month: {
                        type: String,
                        required: true
                    },
                    year: {
                        type: String,
                        required: true
                    }
                },
                end_date: {
                    month: {
                        type: String,
                        default: null
                    },
                    year: {
                        type: String,
                        default: null
                    }
                },
                description: {
                    type: String,
                    default: ""
                },
                present: {
                    type: Boolean,
                    default: false
                },
                deleted: {
                    type: Boolean,
                    default: false
                },
                token: {
                    type: String,
                    default: ""
                }
            }
        ],
        education: [
            {
                degree: {
                    type: String,
                    default: ""
                },
                institution: {
                    type: String,
                    default: ""
                },
                year: {
                    type: String,
                    default: null
                },
                deleted: {
                    type: Boolean,
                    default: false
                },
                token: {
                    type: String,
                    default: ""
                }
            }
        ],
        deleted: { 
            type: Boolean, 
            default: false 
        },
        token: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("recruiter", RecruiterSchema);
