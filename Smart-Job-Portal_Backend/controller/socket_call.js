const ApplicationCall = require("../database/models/videocall");
const Application = require("../database/models/applyjobs");
const socket = require("./socket");

/* ================= START CALL ================= */
exports.startCall = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { callType = "video" } = req.body;

    const rawRole = req.userDetails.data.user_type;
    const role =
      rawRole === "recruiter" || rawRole === "job_provider"
        ? "job_provider"
        : "job_seeker";

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if call already exists and is ringing
    const existingCall = await ApplicationCall.findOne({ applicationId });
    if (existingCall && existingCall.status === "ringing") {
      return res.status(400).json({ 
        success: false,
        message: "Call is already ringing" 
      });
    }

    // Create or update call
    const call = await ApplicationCall.findOneAndUpdate(
      { applicationId },
      {
        $set: {
          recruiterId: application.recruiterId,
          userId: application.user,
          callType,
          status: "ringing",
          startedAt: new Date()
        },
        $push: {
          events: {
            type: "call_started",
            byRole: role,
            at: new Date()
          }
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // Get recruiter info for socket event
    const recruiter = req.userDetails.data;
    
    // Emit socket event to job_seeker
    const io = socket.getIO();
    io.to(applicationId.toString()).emit("incomingCall", {
      applicationId,
      callType,
      recruiterId: recruiter._id || recruiter.id,
      recruiterName: recruiter.name || "Recruiter",
      company: recruiter.company || "",
      startedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: "Call started and ringing",
      data: call
    });
  } catch (err) {
    console.error("Start Call Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};

/* ================= ACCEPT CALL ================= */
exports.acceptCall = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const rawRole = req.userDetails.data.user_type;
    const role =
      rawRole === "recruiter" || rawRole === "job_provider"
        ? "job_provider"
        : "job_seeker";

    const call = await ApplicationCall.findOne({ applicationId });
    if (!call) {
      return res.status(404).json({ 
        success: false,
        message: "Call not found" 
      });
    }

    // Update call status
    call.status = "ongoing";
    call.events.push({ 
      type: "call_accepted", 
      byRole: role,
      at: new Date()
    });

    await call.save();

    // Notify recruiter via socket
    const io = socket.getIO();
    io.to(applicationId.toString()).emit("callAccepted", {
      applicationId,
      acceptedBy: role,
      acceptedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true,
      message: "Call accepted",
      data: call
    });
  } catch (err) {
    console.error("Accept Call Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};

/* ================= REJECT CALL ================= */
exports.rejectCall = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const rawRole = req.userDetails.data.user_type;
    const role =
      rawRole === "recruiter" || rawRole === "job_provider"
        ? "job_provider"
        : "job_seeker";

    const call = await ApplicationCall.findOne({ applicationId });
    if (!call) {
      return res.status(404).json({ 
        success: false,
        message: "Call not found" 
      });
    }

    call.status = "ended";
    call.endedAt = new Date();
    call.events.push({ 
      type: "call_rejected", 
      byRole: role,
      at: new Date(),
      reason: reason
    });

    await call.save();

    const io = socket.getIO();
    io.to(applicationId.toString()).emit("callRejected", {
      applicationId,
      rejectedBy: role,
      reason: reason || "User rejected the call",
      rejectedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true,
      message: "Call rejected"
    });
  } catch (err) {
    console.error("Reject Call Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};

/* ================= END CALL ================= */
exports.endCall = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const rawRole = req.userDetails.data.user_type;
    const role =
      rawRole === "recruiter" || rawRole === "job_provider"
        ? "job_provider"
        : "job_seeker";

    const call = await ApplicationCall.findOne({ applicationId });
    if (!call) {
      return res.status(404).json({ 
        success: false,
        message: "Call not found" 
      });
    }

    call.status = "ended";
    call.endedAt = new Date();
    call.events.push({ 
      type: "call_ended", 
      byRole: role,
      at: new Date()
    });

    await call.save();

    const io = socket.getIO();
    io.to(applicationId.toString()).emit("callEnded", {
      applicationId,
      endedBy: role,
      endedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true,
      message: "Call ended"
    });
  } catch (err) {
    console.error("End Call Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};

/* ================= GET CALL DETAILS ================= */
exports.getCallByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const call = await ApplicationCall.findOne({ applicationId })
      .populate("recruiterId", "name email company")
      .populate("userId", "name email");

    if (!call) {
      return res.status(404).json({ 
        success: false,
        message: "Call not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: call 
    });
  } catch (err) {
    console.error("Get Call Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};