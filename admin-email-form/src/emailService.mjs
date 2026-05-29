import { config, missingSmtpConfig } from "./config.mjs";

export class EmailConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export async function sendAdminEmail(submission) {
  const email = buildEmail(submission);

  if (config.mailMode === "preview") {
    console.log(`[preview-email] to=${config.adminEmail} subject="${email.subject}"`);
    return { mode: "preview" };
  }

  if (config.mailMode !== "smtp") {
    throw new EmailConfigurationError("MAIL_MODE harus preview atau smtp.");
  }

  const missing = missingSmtpConfig();
  if (missing.length) {
    throw new EmailConfigurationError(`Konfigurasi email belum lengkap: ${missing.join(", ")}.`);
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: config.adminEmail,
    subject: email.subject,
    text: email.text,
    html: email.html
  });

  return { mode: "smtp" };
}

function buildEmail(submission) {
  const submittedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  });

  const rows = [
    ["Nama", submission.name],
    ["Nama pendek", submission.shortName],
    ["Alamat", submission.address],
    ["Dikirim", submittedAt]
  ];

  return {
    subject: "Data nama dan alamat user",
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #151922;">
        <h2>Data nama dan alamat user</h2>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th align="left" style="border: 1px solid #d8deea; background: #f5f7fb;">${escapeHtml(label)}</th>
                  <td style="border: 1px solid #d8deea;">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join("")}
        </table>
      </div>
    `
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
