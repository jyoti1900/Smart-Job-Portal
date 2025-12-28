const router = require("express").Router();

router.get('/', (req, res) => {
    res.json({success: true, message: "Server running"});
})

router.use('/api/v1', require('./v1'));

module.exports = router;