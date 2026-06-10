// Nodemailer Email Notification Service
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Setup a SMTP transporter (Ethereal fake account / mock / console logger fallback)
let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Console logging transport fallback for development/local testing
  transporter = {
    sendMail: async (mailOptions) => {
      logger.info(`[Email Service Mock] Sending email to ${mailOptions.to} with subject "${mailOptions.subject}"`);
      logger.info(`[Email Body]:\n${mailOptions.text || mailOptions.html}`);
      return { messageId: 'mock-id-' + Date.now() };
    }
  };
}

class EmailService {
  static async sendMail(to, subject, htmlContent, textContent = '') {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"i-SOFTZONE Alerts" <no-reply@i-softzone.com>',
        to,
        subject,
        html: htmlContent,
        text: textContent || 'Please enable HTML view to read this email.'
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId} to ${to}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      // Suppress email errors to prevent breaking API transaction flows
    }
  }

  static async sendWelcomeEmail(to, name, tempPassword = 'password123') {
    const subject = 'Welcome to i-SOFTZONE!';
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
        <h2 style="color: #4f46e5;">Welcome to i-SOFTZONE, ${name}!</h2>
        <p>Your employee profile has been registered successfully by the system administrator.</p>
        <p>You can now log in using your email address and credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${to}</li>
          <li><strong>Default Password:</strong> ${tempPassword}</li>
        </ul>
        <p>Please change your password immediately after logging in from your Profile page.</p>
        <br>
        <p>Regards,<br><strong>HR Operations Team</strong></p>
      </div>
    `;
    return await this.sendMail(to, subject, htmlContent);
  }

  static async sendLeaveStatusEmail(to, name, leaveDetails, status, remarks = '') {
    const subject = `Leave Request - ${status}`;
    const statusColor = status === 'APPROVED' ? '#10b981' : '#ef4444';
    
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
        <h2>Hello ${name},</h2>
        <p>Your leave request has been reviewed.</p>
        <div style="padding: 15px; border-left: 4px solid ${statusColor}; background-color: #f9fafb; margin: 15px 0;">
          <p><strong>Leave Type:</strong> ${leaveDetails.leave_name}</p>
          <p><strong>Duration:</strong> ${leaveDetails.from_date} to ${leaveDetails.to_date} (${leaveDetails.total_days} days)</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
          ${remarks ? `<p><strong>Remarks/Reason:</strong> ${remarks}</p>` : ''}
        </div>
        <p>Please check your leave dashboard for full history details.</p>
        <br>
        <p>Regards,<br><strong>System Notification Service</strong></p>
      </div>
    `;
    return await this.sendMail(to, subject, htmlContent);
  }

  static async sendAssetAssignedEmail(to, name, assetDetails) {
    const subject = 'New Asset Allocated to Your Profile';
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
        <h2>Hello ${name},</h2>
        <p>A new hardware/IT asset has been allocated to you in the system inventory database.</p>
        <div style="padding: 15px; border-left: 4px solid #3b82f6; background-color: #f9fafb; margin: 15px 0;">
          <p><strong>Asset Name:</strong> ${assetDetails.asset_name}</p>
          <p><strong>Asset Type:</strong> ${assetDetails.asset_type}</p>
          <p><strong>Serial Number:</strong> ${assetDetails.serial_number}</p>
          ${assetDetails.remarks ? `<p><strong>Remarks:</strong> ${assetDetails.remarks}</p>` : ''}
        </div>
        <p>By accepting this asset, you agree to comply with the corporate IT device policies.</p>
        <br>
        <p>Regards,<br><strong>IT Asset Management Team</strong></p>
      </div>
    `;
    return await this.sendMail(to, subject, htmlContent);
  }
}

module.exports = EmailService;
