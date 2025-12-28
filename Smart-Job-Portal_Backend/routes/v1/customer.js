const router = require("express").Router();
const middleware = require("../../middlewares");

// controllers
const loginController = require("../../controller/customer/login");
const user_signup = require("../../controller/customer/user_signup");
const userController = require("../../controller/customer/user");
const forget_password = require("../../controller/customer/forgetPassword");
const reset_password = require("../../controller/customer/forgetPassword");

//Job Category Controller
const jobCatController = require('../../controller/job_categories');
router.post('/add-job-category', jobCatController.addCategories);
router.get('/list-job-categories', jobCatController.listCategories);
router.get('/job-category-dropdown', jobCatController.categoryListDropdown);

// login route
router.post("/login", loginController.login);
// register route
router.post("/user_signup", user_signup.user_signup);
router.post("/forget_password", forget_password.forgetPassword);
router.put("/reset_password", reset_password.resetPassword);

// user route
router.put("/user-update/:id", middleware.validateToken, middleware.uploadFiles, userController.updateProfile);
router.get("/user-list/:id", userController.listProfile);

router.post("/user/:userId/experience/add", middleware.validateToken, userController.addExperience);
router.post("/user/:userId/project/add", middleware.validateToken, userController.addProject);
router.post("/user/:userId/certification/add", middleware.validateToken, middleware.uploadFile, userController.addCertification);
router.post("/user/:userId/education/add", middleware.validateToken, userController.addEducation);

router.put("/user/:userId/experience/:experienceId/update", middleware.validateToken, userController.updateExperience);
router.put("/user/:userId/project/:projectId/update", middleware.validateToken, userController.updateProject);
router.put("/user/:userId/certification/:certificationId/update", middleware.validateToken, middleware.uploadFile, userController.updateCertification);
router.put("/user/:userId/education/:educationId/update", middleware.validateToken, userController.updateEducation);

router.delete("/user/:userId/experience/:experienceId/delete", middleware.validateToken, userController.deleteExperience);
router.delete("/user/:userId/project/:projectId/delete", middleware.validateToken, userController.deleteProject);
router.delete("/user/:userId/certification/:certificationId/delete", middleware.validateToken, userController.deleteCertification);
router.delete("/user/:userId/education/:educationId/delete", middleware.validateToken, userController.deleteEducation);

router.delete("/user/:userId/resume/delete", middleware.validateToken, userController.deleteResume);

const applyJobsController = require("../../controller/customer/applyjobs");
router.post("/apply-job", middleware.validateToken, applyJobsController.applyJob);
router.get("/applications", middleware.validateToken, applyJobsController.listUserApplications);

const allJobsController = require("../../controller/customer/alljobs");
router.get("/jobs", allJobsController.listJobForUsers);

module.exports = router;
