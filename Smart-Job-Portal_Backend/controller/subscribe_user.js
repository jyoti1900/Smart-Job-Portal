const Contact = require("../database/models/subscribe_users");
const sendEmail = require("../utility/emailServices");

exports.subscribeUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        // Save to DB
        const contact = await Contact.create({
            email
        });

        // Send Email to Admin
        await sendEmail({
            to: process.env.EMAIL_USER, // Admin email
            subject: "New Newsletter Subscription | KaajKhojo",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color:#2f7832;">New Newsletter Subscription</h2>
                <p>A new user has subscribed to the <strong>KaajKhojo Newsletter</strong>.</p>
                <hr/>
                <p><strong>Subscriber Email:</strong> ${email}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <hr/>
                <p style="font-size:13px;color:#666;">
                    This message was automatically generated from KaajKhojo.
                </p>
                </div>
            `
        });

        // Auto-reply to Subscriber
        await sendEmail({
            to: email,
            subject: "🎉 Welcome to KaajKhojo Newsletter!",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color:#2f7832;">Welcome to KaajKhojo 👋</h2>
                <p>Hi there,</p>
                <p>
                    Thank you for subscribing to the <strong>KaajKhojo Newsletter</strong>! 🎯
                </p>
                <p>
                    You’ll now receive:
                </p>
                <ul>
                    <li>🔥 Latest job opportunities</li>
                    <li>💼 Career tips & insights</li>
                    <li>📢 Platform updates</li>
                    <li>🚀 Hiring & recruitment news</li>
                </ul>
                <p>
                    We promise not to spam you and only send valuable updates.
                </p>
                <br/>
                <p>
                    Best regards,<br/>
                    <strong>KaajKhojo Team</strong><br/>
                    <span style="color:#666;font-size:13px;">
                    Connecting Talent with Opportunity
                    </span>
                </p>
                <hr/>
                <p style="font-size:12px;color:#999;">
                    If you did not subscribe, you may safely ignore this email.
                </p>
                </div>
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
