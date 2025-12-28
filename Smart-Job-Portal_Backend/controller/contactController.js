const Contact = require("../database/models/contact");
const sendEmail = require("../utility/emailServices");

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    // 1️⃣ Save to DB
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    // 2️⃣ Send Email to Admin
    await sendEmail({
      to: process.env.EMAIL_USER, // admin email
      subject: `KaajKhojo Contact Us Message: ${subject || "No Subject"}`,
      html: `
        <h2>New Contact Message From KaajKhojo</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    // 3️⃣ Auto-Reply to User (Optional but Professional)
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for contacting <b>KaajKhojo</b>.</p>
        <p>We have received your message and will get back to you shortly.</p>
        <br />
        <p>Regards,<br/>KaajKhojo Team</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({
      success: false,
      message: "Email sending failed",
      error: error.message
    });
  }
};
