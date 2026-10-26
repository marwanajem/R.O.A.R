import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
 
  tls: {
    rejectUnauthorized: false
  }
});

export const sendOTP = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"ROAR Championship" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Verify your ROAR Championship Account',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #D4AF37;">Welcome to ROAR Championship!</h2>
        <p>Your 6-digit email verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; padding: 10px; background: #f4f4f4; display: inline-block;">
          ${otpCode}
        </div>
        <p>This code will allow you to complete your registration and log in.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};