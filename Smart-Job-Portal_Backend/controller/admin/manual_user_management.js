const UserModel = require("../../database/models/users");

exports.listUser = async (req, res) => {
    try {
        let { page = 1, perPage = 10 } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);

        const query = { deleted: { $ne: true } }; // hide soft deleted

        const data = await UserModel.find(query)
            .sort({ _id: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const count = await UserModel.countDocuments(query);

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

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        await UserModel.findByIdAndUpdate(
            userId,
            { deleted: true },
            { new: true } // return updated doc
        );
        res.json({
            success: true,
            message: "User deleted successfully"
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
