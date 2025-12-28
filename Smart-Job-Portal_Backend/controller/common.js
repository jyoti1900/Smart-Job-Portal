const EducationYear = require("../database/models/education_date");
const ExperienceMonth = require("../database/models/experience_month");
const ExperienceYear = require("../database/models/experience_year");

// Add Education Year
exports.addEducationYear = async (req, res) => {
    try {
        const { passoutyear } = req.body;

        if (!passoutyear) {
            return res.status(400).json({
                success: false,
                message: "Passout year is required"
            });
        }

        const exists = await EducationYear.findOne({ passoutyear: passoutyear.trim(), deleted: false });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Year already exists"
            });
        }

        await EducationYear.create({ passoutyear });

        res.json({
            success: true,
            message: "Education year added successfully"
        });
    } catch (err) {
        console.error("Add Education Year Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

// Dropdown - Education Years only
exports.educationYearDropdown = async (req, res) => {
    try {
        const data = await EducationYear.find({ deleted: false })
            .select({ passoutyear: 1 })

        res.json({
            success: true,
            message: "Dropdown years fetched successfully",
            data
        });
    } catch (err) {
        console.error("Dropdown Education Year Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};


// Add Experience Month
exports.addExperienceMonth = async (req, res) => {
    try {
        const { month } = req.body;

        if (!month) {
            return res.status(400).json({
                success: false,
                message: "Month is required"
            });
        }

        const exists = await ExperienceMonth.findOne({ month: month.trim(), deleted: false });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Month already exists"
            });
        }

        await ExperienceMonth.create({ month });

        res.json({
            success: true,
            message: "Experience month added successfully"
        });
    } catch (err) {
        console.error("Add Experience Month Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

// Dropdown - Months only
exports.experienceMonthDropdown = async (req, res) => {
    try {
        const data = await ExperienceMonth.find({ deleted: false })
            .select({ month: 1 });

        res.json({
            success: true,
            message: "Experience months fetched successfully",
            data
        });
    } catch (err) {
        console.error("Dropdown Experience Month Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};



// Add Experience Year
exports.addExperienceYear = async (req, res) => {
    try {
        const { year } = req.body;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: "Year is required"
            });
        }

        const exists = await ExperienceYear.findOne({ year: year.trim(), deleted: false });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Year already exists"
            });
        }

        await ExperienceYear.create({ year });

        res.json({
            success: true,
            message: "Experience year added successfully"
        });
    } catch (err) {
        console.error("Add Experience Year Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

// Dropdown - Years only
exports.experienceYearDropdown = async (req, res) => {
    try {
        const data = await ExperienceYear.find({ deleted: false })
            .select({ year: 1 })

        res.json({
            success: true,
            message: "Experience years fetched successfully",
            data
        });
    } catch (err) {
        console.error("Dropdown Experience Year Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};
