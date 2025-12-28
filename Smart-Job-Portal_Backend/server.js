const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv").config();
const passport = require("passport");
require("./controller/customer/passport");
const cookieSession = require("cookie-session");

const socket = require("./controller/socket"); // ✅ ADD THIS

const app = express();
const config = (global.config = require("./config")["development"]);

const PORT = config.port.http || 8080;
const NODE_ENV = "development";

/* ================= SESSION ================= */
app.use(
  cookieSession({
    name: "session",
    keys: ["process.env.SESSION_SECRET"],
    maxAge: 24 * 60 * 60 * 100
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(bodyParser.json());
app.use("/public", express.static(__dirname + "/public/uploads/"));
app.use("/assets", express.static(__dirname + "/assets"));

/* ================= ROUTES ================= */
app.use("/", require("./routes"));

/* ================= DB ================= */
require("./database").connect(true);

/* ================= HTTP SERVER ================= */
const server = http.createServer(app);

/* ================= SOCKET INIT ================= */
socket.init(server); // ✅ VERY IMPORTANT

/* ================= START SERVER ================= */
server.listen(PORT, () => {
  console.log(`Server running on ${PORT} | ENV: ${NODE_ENV}`);
});
