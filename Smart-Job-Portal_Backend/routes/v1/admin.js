const router = require("express").Router();
const middleware = require('../../middlewares');

// controllers
const loginController = require('../../controller/customer/login');
const signupController = require('../../controller/admin/admin_signup');
const recruiterController = require('../../controller/admin/recruiter_management');
const jobController = require('../../controller/admin/job_management');

// Admin route
router.post('/login', loginController.login);
router.post('/signup', signupController.admin_signup);
router.get('/list-recruiter', recruiterController.listRecruiter);
router.delete("/delete-recruiter/:recruiterId", recruiterController.deleteRecruiter);

router.get("/list-job", jobController.listJob);
router.delete("/delete-job/:jobId", jobController.deleteJob);

// User routes
const userController = require('../../controller/admin/manual_user_management');
router.get('/list-users', userController.listUser);
router.delete("/delete-user/:userId", userController.deleteUser);

// Google User routes
// const googleUserController = require('../../controller/admin/google_user_management');
// router.get('/list-google-users', googleUserController.listGoogleUser);
// router.delete("/delete-google-user/:userId", googleUserController.deleteGoogleUser);

// Applicant routes
const applicantController = require('../../controller/admin/applicant_management');
router.get('/list-applicants', applicantController.listApplicants);
router.delete("/delete-applicant/:applicantId", applicantController.deleteApplicant);

// Admin Overview Controller
const adminController = require('../../controller/admin/adminController');
router.get("/overview", adminController.getDashboardStats);
router.get("/user-growth", adminController.getUserGrowth);
router.get("/job-category", adminController.getJobCategory);

// //FAQs
// router.post('/add-faq',middleware.validateToken, middleware.uploadImg, faqConstroller.addFaq);
// router.get('/list-faq',middleware.validateToken, faqConstroller.listFaq);
// router.put("/update-faq/:faqId",middleware.validateToken, middleware.uploadImg, faqConstroller.updateFaq);
// router.delete("/delete-faq/:faqId",middleware.validateToken, faqConstroller.deleteFaq);


module.exports = router;