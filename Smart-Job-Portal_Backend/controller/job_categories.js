const JobCatModel = require("../database/models/job_categories");

// 📌 Add Category
exports.addCategories = async (req, res) => {
    try {
        const { cat_name } = req.body;

        if (!cat_name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const exists = await JobCatModel.findOne({ cat_name: cat_name.trim(), deleted: false });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        await JobCatModel.create({ cat_name });

        res.json({
            success: true,
            message: "Category added successfully"
        });
    } catch (err) {
        console.error("Add Category Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

// 📌 List Categories (with pagination)
exports.listCategories = async (req, res) => {
    try {
        let { page = 1, perPage = 10 } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);

        const query = {};

        const data = await JobCatModel.find(query)
            .sort({ _id: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const count = await JobCatModel.countDocuments(query);

        res.json({
            success: true,
            message: "Categories fetched successfully",
            data,
            count
        });
    } catch (err) {
        console.error("List Categories Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

// 📌 Dropdown List
exports.categoryListDropdown = async (req, res) => {
    try {
        const data = await JobCatModel.find()
          .select({ cat_name: 1 })
          .sort({ cat_name: 1 });

        res.json({
            success: true,
            message: "Dropdown categories fetched successfully",
            data
        });
    } catch (err) {
        console.error("Dropdown Category Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};
