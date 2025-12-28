const router = require("express").Router();

router.use('/admin', require('./admin'));
router.use('/customer', require('./customer'));
router.use('/common', require('./common'));
router.use('/recruiter', require('./recruiter'));

module.exports = router;