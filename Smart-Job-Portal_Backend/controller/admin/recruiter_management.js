const RecruiterModel = require("../../database/models/recruiter");

exports.listRecruiter = async (req, res) => {
    try {
        let { page = 1, perPage = 10 } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);

        const query = { deleted: { $ne: true } }; // hide soft deleted

        const data = await RecruiterModel.find(query)
            .sort({ _id: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const count = await RecruiterModel.countDocuments(query);

        res.json({
            success: true,
            message: "Data fetched successfully",
            data,
            count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err
        });
    }
};

exports.updateRecruiter = async (req, res) => {
    try {
        const recruiterId = req.params.recruiterId;
        const updateData = req.body; // fields to update

        // Prevent updating deleted recruiters
        const recruiter = await RecruiterModel.findOneAndUpdate(
            { _id: recruiterId, deleted: { $ne: true } }, // only non-deleted
            updateData,
            { new: true } // return updated document
        );

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: "Recruiter not found or already deleted",
            });
        }

        res.json({
            success: true,
            message: "Recruiter updated successfully",
            data: recruiter,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err,
        });
    }
};

exports.deleteRecruiter = async (req, res) => {
    try {
        const recruiterId = req.params.recruiterId;
        await RecruiterModel.findByIdAndUpdate(
            recruiterId,
            { deleted: true },
            { new: true } // return updated doc
        );
        res.json({
            success: true,
            message: "Recruiter deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err
        });
    }
};
