// BizPilot Communication Service
// Integrated with sms.net.bd (SMS.bd / Alpha Net) & Nodemailer SMTP Gateway

const nodemailer = require('nodemailer');

class CommunicationService {
  constructor() {
    this.logs = [];
    this.transporter = null;
  }

  getTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    if (!this.transporter) {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
    }

    return this.transporter;
  }

  // Normalize Bangladesh phone numbers (e.g. "01700000000" or "+8801700000000" -> "8801700000000")
  normalizeBdPhone(raw) {
    if (!raw) return null;
    let s = String(raw).trim().replace(/[\s\-()]/g, '');
    if (!s) return null;

    if (s.startsWith('+')) {
      s = s.slice(1);
    }

    if (/^01[3-9]\d{8}$/.test(s)) {
      return `88${s}`;
    }

    if (/^8801[3-9]\d{8}$/.test(s)) {
      return s;
    }

    return s;
  }

  /**
   * Build a complete, well-formed email payload with both HTML and plain-text
   * parts plus anti-spam headers so messages are not flagged as spam.
   */
  buildEmailPayload({ to, subject, htmlContent, text, metadata = {} }) {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'BizPilot <no-reply@bizpilot.com>';
    const fromName = 'BizPilot';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'no-reply@bizpilot.com';

    // Plain-text fallback (always present, even when only HTML is supplied)
    let plainText = text;
    if (!plainText && htmlContent) {
      plainText = htmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (!plainText) {
      plainText = `Thank you for your business with BizPilot.\n\nIf you need assistance, reply to this email or contact us at ${supportEmail}.\n\n© ${new Date().getFullYear()} BizPilot. All rights reserved.`;
    }

    // Wrap raw HTML in a branded, well-structured template when only a fragment is provided
    let html = htmlContent;
    const looksLikeFullDocument = /<!DOCTYPE|<html/i.test(html || '');
    if (html && !looksLikeFullDocument) {
      const brandColor = process.env.EMAIL_BRAND_COLOR || '#6366f1';
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, email=no" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f7; }
    .container { max-width: 640px; margin: 0 auto; }
    .content { background-color: #ffffff; padding: 32px 24px; border-radius: 12px; }
    a { color: ${brandColor}; text-decoration: none; }
  </style>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
          <tr>
            <td style="padding: 16px 0; text-align: center;">
              <span style="font-size: 22px; font-weight: 700; color: ${brandColor};">${fromName}</span>
            </td>
          </tr>
          <tr>
            <td class="content" style="background-color:#ffffff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${html}
              <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                © ${new Date().getFullYear()} ${fromName}. All rights reserved.<br/>
                <a href="mailto:${supportEmail}" style="color:#9ca3af;">${supportEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else if (!html) {
      html = plainText;
    }

    return {
      from: fromAddress,
      to,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'BizPilot Mailer v1.0',
        'List-Unsubscribe': `<mailto:${supportEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': `List-Unsubscribe: <mailto:${supportEmail}?subject=unsubscribe>`,
        'X-BizPilot-Message-ID': metadata.messageId || 'bizpilot-email',
        'Precedence': 'bulk'
      }
    };
  }

  /**
   * Send Email via Nodemailer SMTP or fallback to console simulation
   */
  async sendEmail({ to, subject, htmlContent, text, metadata = {} }) {
    const transporter = this.getTransporter();

    if (transporter && to) {
      try {
        const payload = this.buildEmailPayload({ to, subject, htmlContent, text, metadata });
        const info = await transporter.sendMail(payload);

        const logEntry = {
          id: info.messageId || ('EMAIL-' + Math.floor(100000 + Math.random() * 900000)),
          channel: 'EMAIL',
          to,
          subject,
          metadata,
          sentAt: new Date().toISOString(),
          status: 'Delivered',
          provider: 'SMTP (' + (process.env.SMTP_HOST || 'Live') + ')'
        };

        this.logs.unshift(logEntry);
        console.log(`✉️ [LIVE SMTP] Successfully sent email to ${to}: "${subject}" (MessageID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, status: 'Delivered' };
      } catch (err) {
        console.error(`⚠️ [SMTP ERROR] Failed to send email to ${to}:`, err.message);
        // Fallback to simulated log so transaction is not halted
      }
    }

    // Simulated Email Log
    const logEntry = {
      id: 'EMAIL-' + Math.floor(100000 + Math.random() * 900000),
      channel: 'EMAIL',
      to,
      subject,
      metadata,
      sentAt: new Date().toISOString(),
      status: 'Delivered (Simulated)',
      provider: process.env.EMAIL_GATEWAY_PROVIDER || 'BizPilot Mailer Simulator'
    };

    this.logs.unshift(logEntry);
    console.log(`✉️ [EMAIL SIMULATION] Dispatched email to ${to}: "${subject}" (Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for live dispatch)`);
    return { success: true, messageId: logEntry.id, status: 'Delivered (Simulated)' };
  }

  /**
   * Send Email Verification OTP Code
   */
  async sendVerificationEmail({ to, name = 'Merchant', code }) {
    const subject = `Your BizPilot Verification Code: ${code}`;
    const text = `Hello ${name},\n\nYour BizPilot verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this verification code, please ignore this email.\n\nBizPilot Team`;

    const htmlContent = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="display: inline-block; padding: 6px 16px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; margin-bottom: 20px;">
          <span style="color: #065f46; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Email Verification</span>
        </div>
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Confirm Your Email Address</h2>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
          Hello <strong style="color: #0f172a;">${name}</strong>,<br />
          Thank you for starting your registration with <strong>BizPilot</strong>. Enter the 6-digit verification code below to activate your merchant account:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #059669; border-radius: 16px; padding: 20px 24px; display: inline-block; margin: 0 auto 24px auto;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #059669; display: block; margin-left: 10px;">
            ${code}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
          ⏱️ This code will expire in <strong>10 minutes</strong>.<br />
          If you didn't create an account with BizPilot, please safely ignore this message.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      htmlContent,
      text,
      metadata: { type: 'EMAIL_VERIFICATION', code }
    });
  }

  /**
   * Send SMS via sms.net.bd API or fallback to console simulation
   */
  async sendSMS({ phone, text, metadata = {} }) {
    const apiKey = process.env.SMS_BD_API_KEY;
    const senderId = process.env.SMS_BD_SENDER_ID || '';
    const apiUrl = process.env.SMS_BD_BASE_URL || 'https://api.sms.net.bd/sendsms';
    const normalizedTo = this.normalizeBdPhone(phone);

    if (apiKey && normalizedTo && text) {
      try {
        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('msg', text);
        formData.append('to', normalizedTo);
        if (senderId) {
          formData.append('sender_id', senderId);
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data && (data.error === 0 || data.status === 'success' || data.request_id)) {
          const logEntry = {
            id: String(data.request_id || data.msg_id || 'SMS-BD-' + Date.now()),
            channel: 'SMS',
            phone: normalizedTo,
            text,
            metadata,
            sentAt: new Date().toISOString(),
            status: 'Delivered',
            provider: 'sms.net.bd'
          };
          this.logs.unshift(logEntry);
          console.log(`📱 [LIVE SMS.BD] Sent SMS to ${normalizedTo}: "${text.slice(0, 40)}..." (Response:`, data, `)`);
          return { success: true, messageId: logEntry.id, status: 'Delivered', response: data };
        } else {
          console.warn(`⚠️ [SMS.BD WARNING] API Response code ${res.status}:`, data);
        }
      } catch (err) {
        console.error(`⚠️ [SMS.BD ERROR] Failed sending to ${normalizedTo}:`, err.message);
      }
    }

    // Simulated SMS Log
    const logEntry = {
      id: 'SMS-' + Math.floor(100000 + Math.random() * 900000),
      channel: 'SMS',
      phone: normalizedTo || phone,
      text,
      metadata,
      sentAt: new Date().toISOString(),
      status: 'Delivered (Simulated)',
      provider: process.env.SMS_GATEWAY_PROVIDER || 'sms.net.bd Simulator'
    };

    this.logs.unshift(logEntry);
    console.log(`📱 [SMS SIMULATION] Dispatched SMS to ${phone}: "${text.slice(0, 40)}..." (Set SMS_BD_API_KEY in backend/.env for live dispatch)`);
    return { success: true, messageId: logEntry.id, status: 'Delivered (Simulated)' };
  }

  /**
   * Send Order Cancellation Email to Customer
   */
  async sendCancellationEmail({ order, merchant, reason, notes }) {
    const email = order.customer_email || order.customer?.email;
    if (!email || !email.includes('@')) return null;

    const currencySymbol = merchant?.currency === 'USD' ? '$' : (merchant?.currency === 'EUR' ? '€' : (merchant?.currency === 'GBP' ? '£' : '৳'));
    const items = order.items || [];
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 600; color:#111827;">${item.product_name || item.name || 'Item'}</td>
        <td style="padding: 10px 12px; text-align: center; color:#374151;">${item.quantity}</td>
        <td style="padding: 10px 12px; text-align: right; color:#374151;">${currencySymbol}${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; color:#111827;">${currencySymbol}${Number(item.line_total || (item.quantity * item.unit_price) || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 800;">${merchant?.business_name || 'BizPilot Commerce'}</h2>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Order Cancellation Notification</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #1f2937;">
          Hello <strong>${order.customer_name || 'Valued Customer'}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Your Order <strong>#${order.order_number}</strong> has been cancelled by the merchant.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 13px; color: #991b1b; font-weight: 700; margin-bottom: 4px;">Cancellation Details</div>
          <div style="font-size: 13px; color: #7f1d1d;"><strong>Reason:</strong> ${reason || 'Merchant Cancelled'}</div>
          ${notes ? `<div style="font-size: 12px; color: #b91c1c; margin-top: 4px;"><strong>Note:</strong> ${notes}</div>` : ''}
          <div style="font-size: 12px; color: #047857; margin-top: 8px; font-weight: 600;">
            ℹ️ As this order was unpaid, no charges were processed and no further action is required from you.
          </div>
        </div>

        ${items.length > 0 ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Cancelled Item</th>
                <th style="padding: 8px 10px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Qty</th>
                <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Unit Price</th>
                <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top: 12px; text-align: right; font-size: 13px; font-weight: 700; color: #374151;">
            Order Value: ${currencySymbol}${Number(order.total || 0).toFixed(2)}
          </div>
        ` : ''}

        <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
          If you have any questions, please contact <strong>${merchant?.business_name || 'BizPilot'}</strong> at <a href="mailto:${merchant?.email || 'support@bizpilot.com'}" style="color: #dc2626;">${merchant?.email || 'support@bizpilot.com'}</a>.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order #${order.order_number} Cancelled - ${merchant?.business_name || 'BizPilot'}`,
      htmlContent,
      text: `Order #${order.order_number} Cancelled - ${merchant?.business_name || 'BizPilot'}\n\nHello ${order.customer_name || 'Valued Customer'},\n\nYour Order #${order.order_number} has been cancelled.\nReason: ${reason || 'Merchant Cancelled'}\n\nAs this order was unpaid, no charges were processed.\n\nThank you for considering ${merchant?.business_name || 'BizPilot'}.`
    });
  }

  /**
   * Send Order Refund Confirmation Email to Customer
   */
  async sendRefundEmail({ order, refund, merchant }) {
    const email = order.customer_email || order.customer?.email;
    if (!email || !email.includes('@')) return null;

    const currencySymbol = merchant?.currency === 'USD' ? '$' : (merchant?.currency === 'EUR' ? '€' : (merchant?.currency === 'GBP' ? '£' : '৳'));
    const items = order.items || [];
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 600; color:#111827;">${item.product_name || item.name || 'Item'}</td>
        <td style="padding: 10px 12px; text-align: center; color:#374151;">${item.quantity}</td>
        <td style="padding: 10px 12px; text-align: right; color:#374151;">${currencySymbol}${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; color:#111827;">${currencySymbol}${Number(item.line_total || (item.quantity * item.unit_price) || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
        <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #7c3aed; font-size: 24px; font-weight: 800;">${merchant?.business_name || 'BizPilot Commerce'}</h2>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Official Refund Receipt</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #1f2937;">
          Hello <strong>${order.customer_name || 'Valued Customer'}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          We have successfully processed a refund for your Order <strong>#${order.order_number}</strong>.
        </p>

        <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px;">Refund Summary</div>
          <div style="font-size: 28px; font-weight: 900; color: #5b21b6; margin: 8px 0;">
            ${currencySymbol}${Number(refund.amount || order.total || 0).toFixed(2)}
          </div>
          <table role="presentation" width="100%" style="font-size: 13px; color: #4c1d95; margin-top: 10px;">
            <tr>
              <td style="padding: 4px 0;"><strong>Refund Method:</strong></td>
              <td style="text-align: right; padding: 4px 0;">${refund.method || 'Original Payment Method'}</td>
            </tr>
            ${refund.transaction_id ? `
              <tr>
                <td style="padding: 4px 0;"><strong>Transaction Ref / TrxID:</strong></td>
                <td style="text-align: right; padding: 4px 0; font-family: monospace; font-weight: 700;">${refund.transaction_id}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0;"><strong>Date Processed:</strong></td>
              <td style="text-align: right; padding: 4px 0;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
          ${refund.notes ? `
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #c4b5fd; font-size: 12px; color: #6d28d9;">
              <strong>Merchant Note:</strong> ${refund.notes}
            </div>
          ` : ''}
        </div>

        ${items.length > 0 ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Refunded Item</th>
                <th style="padding: 8px 10px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Qty</th>
                <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Unit Price</th>
                <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        ` : ''}

        <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
          Depending on your bank or payment provider, it may take 1-3 business days for the funds to reflect in your account.<br/>
          If you have questions regarding this refund, contact <strong>${merchant?.business_name || 'BizPilot'}</strong> at <a href="mailto:${merchant?.email || 'support@bizpilot.com'}" style="color: #7c3aed;">${merchant?.email || 'support@bizpilot.com'}</a>.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Refund Confirmation for Order #${order.order_number} - ${merchant?.business_name || 'BizPilot'}`,
      htmlContent,
      text: `Refund Confirmation for Order #${order.order_number} - ${merchant?.business_name || 'BizPilot'}\n\nHello ${order.customer_name || 'Valued Customer'},\n\nA refund of ${currencySymbol}${Number(refund.amount || order.total || 0).toFixed(2)} for Order #${order.order_number} has been processed.\nMethod: ${refund.method || 'Original Payment Method'}\nReference: ${refund.transaction_id || 'N/A'}\n\nThank you for your patience.`
    });
  }

  getLogs() {
    return this.logs;
  }
}

module.exports = new CommunicationService();