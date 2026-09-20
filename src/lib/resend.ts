const FROM_EMAIL = "no-reply@akshar.ashifcodes.tech";
const REPLY_TO = "md.ashif.dev@gmail.com";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: REPLY_TO,
      subject: "Akshar — Reset Your Password",
      html: resetPasswordHtml(resetUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function resetPasswordHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Akshar — Reset Your Password</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f3ef; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#242424;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    Reset your Akshar password.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3ef; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background:#ffffff; border-radius:14px; overflow:hidden;">

          <tr>
            <td style="padding:34px 42px 28px; border-bottom:1px solid #eeeae4;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:28px; line-height:32px; font-weight:600; color:#171717;">
                      Akshar
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:46px 42px 42px;">

              <div style="font-size:12px; line-height:18px; color:#8a857d; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:18px;">
                Password reset
              </div>

              <h1 style="margin:0 0 24px; font-family:Georgia, 'Times New Roman', serif; font-size:32px; line-height:40px; font-weight:500; color:#171717;">
                Reset your password
              </h1>

              <p style="margin:0 0 18px; font-size:16px; line-height:28px; color:#45413c;">
                We received a request to reset the password for your Akshar account. Click the button below to choose a new password.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display:inline-block; background:#171717; color:#ffffff; font-size:15px; font-weight:500; text-decoration:none; padding:14px 32px; border-radius:8px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px; font-size:16px; line-height:28px; color:#45413c;">
                This link will expire in one hour. If you did not request a password reset, you can safely ignore this email.
              </p>

              <p style="margin:0 0 30px; font-size:16px; line-height:28px; color:#45413c;">
                If the button above does not work, copy and paste the following link into your browser:
              </p>

              <p style="margin:0 0 30px; font-size:13px; line-height:22px; color:#8a857d; word-break:break-all;">
                ${resetUrl}
              </p>

              <p style="margin:30px 0 0; font-size:13px; line-height:22px; color:#8a857d;">
                Please do not reply to this email.
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:28px 42px 34px; border-top:1px solid #eeeae4;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:24px; color:#292622;">
                A quieter place to read.
              </div>
              <div style="margin-top:10px; font-size:12px; line-height:20px; color:#9a958e;">
                &copy; 2026 Akshar. All rights reserved.
              </div>
            </td>
          </tr>

        </table>

        <div style="max-width:620px; padding:20px 20px 0; font-size:11px; line-height:18px; color:#aaa49c;">
          This is an automated service communication from Akshar.
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
