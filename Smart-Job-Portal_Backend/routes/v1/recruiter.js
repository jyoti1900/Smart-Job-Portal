const router = require("express").Router();
const middleware = require("../../middlewares");


// controllers
const recruiter_signup = require("../../controller/recruiter/recruiter_signup");
const loginController = require("../../controller/recruiter/login");
const forget_password = require("../../controller/recruiter/forgetPassword");
const reset_password = require("../../controller/recruiter/forgetPassword");
const { addJob, updateJob, deleteJob, listMyJobs} = require("../../controller/recruiter/job_management");

//recruiter signup
router.post("/recruiter_signup", middleware.uploadImg, recruiter_signup.recruiter_signup);
router.post("/recruiter_login", loginController.login);
router.post("/forget_password", forget_password.forgetPassword);
router.put("/reset_password", reset_password.resetPassword);

// Job Management
router.post("/jobs", middleware.validateToken, middleware.uploadImgs, addJob);
router.put("/jobs/:jobId", middleware.validateToken, middleware.uploadImgs, updateJob);
router.delete("/jobs/:jobId", middleware.validateToken, deleteJob);
router.get("/jobs", middleware.validateToken, listMyJobs);

// Recruiter Profile
const recruiterController = require("../../controller/recruiter/recruiter");

router.put("/recruiter-update/:id", middleware.validateToken, middleware.uploadFiles, recruiterController.updateRecruiterProfile);
router.get("/recruiter_profile/:id", recruiterController.listRecruiterProfile);

router.post("/recruiter/:recruiterId/experience/add", middleware.validateToken, recruiterController.addRecruiterExperience);
router.post("/recruiter/:recruiterId/education/add", middleware.validateToken, recruiterController.addRecruiterEducation);
router.put("/recruiter/:recruiterId/experience/:experienceId/update", middleware.validateToken, recruiterController.updateRecruiterExperience);
router.put("/recruiter/:recruiterId/education/:educationId/update", middleware.validateToken, recruiterController.updateRecruiterEducation);
router.delete("/recruiter/:recruiterId/experience/:experienceId/delete", middleware.validateToken, recruiterController.deleteRecruiterExperience);
router.delete("/recruiter/:recruiterId/education/:educationId/delete", middleware.validateToken, recruiterController.deleteRecruiterEducation);

// User Applications for Jobs
const userApplyController = require("../../controller/recruiter/userApply");
router.get("/job/:jobId/applicants", middleware.validateToken, userApplyController.getApplicantsForJob);
router.put("/application/:applicationId/status", middleware.validateToken, userApplyController.updateApplicationStatus);

module.exports = router;
