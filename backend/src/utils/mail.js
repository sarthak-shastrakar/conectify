import nodemailer from 'nodemailer';

// Load environment variables (ensure they are defined in .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification code to a user's email.
 * @param {string} to - Recipient email address.
 * @param {string} code - 6‑digit verification code.
 */
export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`
  };
  await transporter.sendMail(mailOptions);
};
