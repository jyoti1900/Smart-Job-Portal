const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        // googleId: {
        //     type: String,
        //     default: ""
        // },
        name: {
            type: String,
            required: true
        },
        title: {
            type: String,
            default: ""
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
        user_type: {
            type: String,
            enum: ["admin", "job_seeker"],
            required: true
        },
        mobile: {
            type: String,
            default: ""
        },
        profile_image: {
            type: String,
            default: ""
        },
        address: {
            type: String,
            default: ""
        },
        about: {
            type: String,
            default: ""
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
                        type: Schema.Types.ObjectId,
                        ref: "ExperienceMonth",
                        required: true
                    },
                    year: {
                        type: Schema.Types.ObjectId,
                        ref: "ExperienceYear",
                        required: true
                    }
                },
                end_date: {
                    month: {
                        type: Schema.Types.ObjectId,
                        ref: "ExperienceMonth",
                        default: null
                    },
                    year: {
                        type: Schema.Types.ObjectId,
                        ref: "ExperienceYear",
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
        project: [
            {
                projectName: {
                    type: String,
                    default: ""
                },
                brief: {
                    type: String,
                    default: ""
                },
                link: {
                    type: String,
                    default: ""
                },
                skillTag: {
                    type: [String],
                    default: []
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
        certification: [
            {
                certificationName: {
                    type: String,
                    default: ""
                },
                learned: {
                    type: String,
                    default: ""
                },
                link: {
                    type: String,
                    default: ""
                },
                skillTag: {
                    type: [String],
                    default: []
                },
                document: {
                    type: String,
                    default: ""
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
                    type: Schema.Types.ObjectId,
                    ref: "EducationYear",
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
        document: {
            type: String,
            default: ""
        },
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

module.exports = mongoose.model("users", UserSchema);
