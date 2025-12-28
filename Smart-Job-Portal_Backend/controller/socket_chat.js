const ApplicationChat = require("../database/models/chat");
const Application = require("../database/models/applyjobs");

exports.sendMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const senderId = req.userDetails.data._id;
    const userType = req.userDetails.data.user_type;

    const senderRole =
      userType === "recruiter" || userType === "job_provider"
        ? "job_provider"
        : "job_seeker";

    let chat = await ApplicationChat.findOne({ applicationId });

    if (!chat) {
      const application = await Application.findById(applicationId);
      chat = new ApplicationChat({
        applicationId,
        recruiterId: application.recruiterId,
        userId: application.user,
        messages: []
      });
    }

    const newMessage = { 
      senderRole, 
      senderId, 
      message: message.trim(),
      createdAt: new Date()
    };
    
    chat.messages.push(newMessage);
    await chat.save();

    // Get the saved message with ID
    const savedMessage = chat.messages[chat.messages.length - 1];
    
    // Prepare message data for Socket.io
    const messageData = {
      _id: savedMessage._id,
      senderRole: savedMessage.senderRole,
      senderId: savedMessage.senderId,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt
    };

    // Broadcast via Socket.io
    const io = require('./socket').getIO();
    io.to(applicationId.toString()).emit("receiveMessage", {
      applicationId,
      message: messageData
    });

    console.log('📤 Broadcasted message via Socket.io to room:', applicationId);

    res.status(200).json({ 
      success: true, 
      data: messageData 
    });
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getChatByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const chat = await ApplicationChat.findOne({ applicationId })
      .select("messages recruiterId userId applicationId updatedAt")
      .populate({
        path: "recruiterId",
        select: "name email",
        options: { lean: true }
      })
      .populate({
        path: "userId",
        select: "name email",
        options: { lean: true }
      })
      .lean(); // 🔥 VERY IMPORTANT

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


