const router = require("express").Router();
const middleware = require("../../middlewares");
// controllers
const loginController = require("../../controller/customer/login");
const commonController = require("../../controller/common");
const { submitContact } = require("../../controller/contactController");
const { subscribeUser } = require("../../controller/subscribe_user");


// login route
router.post("/login", loginController.login);

router.post("/user-experience-month", commonController.addExperienceMonth);
router.get("/user-experience-month-dropdown", commonController.experienceMonthDropdown);
router.post("/user-experience-year", commonController.addExperienceYear);
router.get("/user-experience-year-dropdown", commonController.experienceYearDropdown);

router.post("/user-education-year", commonController.addEducationYear);
router.get("/user-education-year-dropdown", commonController.educationYearDropdown);

router.post("/contact", submitContact);
router.post("/subscribe-user", subscribeUser);

const chat  = require("../../controller/socket_chat");
router.post("/applications/:applicationId/chat", middleware.validateToken, chat.sendMessage);
router.get("/applications/:applicationId/chat", middleware.validateToken, chat.getChatByApplication);

const videocall = require("../../controller/socket_call");
router.post("/applications/:applicationId/start-call", middleware.validateToken, videocall.startCall);
router.post("/applications/:applicationId/accept-call", middleware.validateToken, videocall.acceptCall);
router.post("/applications/:applicationId/reject-call", middleware.validateToken, videocall.rejectCall);
router.post("/applications/:applicationId/end-call", middleware.validateToken, videocall.endCall);
router.get("/applications/:applicationId/call-status", middleware.validateToken, videocall.getCallByApplication);
module.exports = router;
