// ===============================
// Import Nodemailer Library
// ===============================
const nodemailer = require("nodemailer");

// ===============================
// Create Email Transporter
// ===============================
// Uses Gmail service with App Password authentication
// EMAIL_USER → your Gmail address
// APP_PASSWORD → Gmail App Password (NOT normal Gmail password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});

// ===============================
// Verify Email Server Connection
// ===============================
// Ensures transporter is correctly configured
// Helpful during server startup for debugging
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email server connection error:", error.message);
  } else {
    console.log("✅ Email server is ready");
  }
});

// ===============================
// Generic Email Sender Function
// ===============================
// Reusable function to send any type of email
// Parameters:
// to      → recipient email
// subject → email subject line
// text    → plain text version (fallback)
// html    → HTML email content
const sendEmail = async (to, subject, text, html) => {
  try {
    // Safety check to avoid crashes
    if (!to) {
      console.log("⚠️ No recipient email provided. Skipping email.");
      return;
    }

    // Send email using configured transporter
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    // Log email message ID (useful for debugging)
    console.log("📧 Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

// ===============================
// Transaction Success Email Helper
// ===============================
// Sends confirmation email after successful transaction
// Parameters:
// userEmail → recipient email
// name      → user's name
// amount    → transaction amount
// toAccount → destination account ID
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  // Email subject
  const subject = "Transaction Successful!";

  // Plain text email (for email clients that don't support HTML)
  const text = `Hello ${name},

Your transaction of $${amount} to account ${toAccount} was successful.

Best regards,
Backend Ledger Team`;

  // HTML email content
  const html = `
    <h3>Transaction Successful ✅</h3>
    <p>Hello ${name},</p>
    <p>Your transaction of <b>$${amount}</b> to account <b>${toAccount}</b> was successful.</p>
    <br/>
    <p>Best regards,<br/>Backend Ledger Team</p>
  `;

  // Send email using generic sender
  await sendEmail(userEmail, subject, text, html);
}

// ===============================
// Export Email Functions
// ===============================
module.exports = {
  sendTransactionEmail,
};