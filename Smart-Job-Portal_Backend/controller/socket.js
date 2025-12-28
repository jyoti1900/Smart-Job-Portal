const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: "/socket.io"
    });

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      /* ======================================================
         JOIN APPLICATION ROOM (CHAT + CALL USE SAME ROOM)
      ====================================================== */
      socket.on("joinApplicationRoom", ({ applicationId, userId, role }) => {
        if (!applicationId) return;

        socket.join(applicationId);
        socket.applicationData = { applicationId, userId, role };

        console.log(`👤 ${role} joined room: ${applicationId}`);

        socket.emit("roomJoined", {
          applicationId,
          role,
          success: true
        });
      });

      /* ======================================================
         REAL-TIME CHAT
      ====================================================== */

      // Join chat explicitly (optional but safe)
      socket.on("joinChat", ({ applicationId, userId, role }) => {
        if (!applicationId) return;

        socket.join(applicationId);
        socket.chatData = { applicationId, userId, role };

        console.log(`💬 ${role} joined chat: ${applicationId}`);

        socket.emit("chatJoined", {
          applicationId,
          success: true
        });
      });

      // Send message
      socket.on("sendMessage", ({ applicationId, message }) => {
        if (!applicationId || !message) return;

        console.log(`📨 Message in ${applicationId}`, message);

        // 🔥 Send to other users
        socket.to(applicationId).emit("newMessage", {
          applicationId,
          message
        });

        // Optional confirmation to sender
        socket.emit("messageSent", {
          success: true,
          message
        });
      });

      /* ======================================================
         CALL SIGNALING
      ====================================================== */

      // Recruiter starts call
      socket.on("startCall", ({ applicationId, callType, recruiterId, recruiterName }) => {
        console.log(`📞 Start call: ${applicationId}`);

        socket.to(applicationId).emit("incomingCall", {
          applicationId,
          callType,
          recruiterId,
          recruiterName,
          timestamp: new Date().toISOString()
        });

        socket.emit("callStarted", {
          applicationId,
          success: true
        });
      });

      // User accepts call
      socket.on("acceptCall", ({ applicationId }) => {
        console.log(`✅ Call accepted: ${applicationId}`);

        socket.to(applicationId).emit("callAccepted", {
          applicationId,
          acceptedAt: new Date().toISOString()
        });
      });

      // User rejects call
      socket.on("rejectCall", ({ applicationId }) => {
        console.log(`❌ Call rejected: ${applicationId}`);

        socket.to(applicationId).emit("callRejected", {
          applicationId,
          rejectedAt: new Date().toISOString()
        });
      });

      // End call
      socket.on("endCall", ({ applicationId }) => {
        console.log(`📴 Call ended: ${applicationId}`);

        socket.to(applicationId).emit("callEnded", {
          applicationId,
          endedAt: new Date().toISOString()
        });
      });

      /* ======================================================
         WEBRTC SIGNALING
      ====================================================== */

      socket.on("webrtcOffer", ({ applicationId, offer }) => {
        socket.to(applicationId).emit("webrtcOffer", {
          offer,
          applicationId
        });
      });

      socket.on("webrtcAnswer", ({ applicationId, answer }) => {
        socket.to(applicationId).emit("webrtcAnswer", {
          answer,
          applicationId
        });
      });

      socket.on("iceCandidate", ({ applicationId, candidate }) => {
        socket.to(applicationId).emit("iceCandidate", {
          candidate,
          applicationId
        });
      });

      /* ======================================================
         DEBUG
      ====================================================== */
      socket.on("debugRooms", () => {
        const rooms = io.sockets.adapter.rooms;
        console.log("🏠 Rooms:", Array.from(rooms.keys()));

        if (socket.applicationData?.applicationId) {
          const room = rooms.get(socket.applicationData.applicationId);
          console.log(
            `👥 Users in ${socket.applicationData.applicationId}:`,
            room ? room.size : 0
          );
        }
      });

      /* ======================================================
         DISCONNECT
      ====================================================== */
      socket.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", socket.id, reason);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("❌ Socket.io not initialized");
    }
    return io;
  }
};
