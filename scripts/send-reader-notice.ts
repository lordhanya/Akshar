import "dotenv/config";

/**
 * Send the "A note to our readers" notice to every registered Akshar user.
 *
 * Standalone CLI mirroring the seed runner patterns:
 *
 *   npx tsx scripts/send-reader-notice.ts              # send to all users
 *   npx tsx scripts/send-reader-notice.ts --dry-run    # list recipients, no email
 *   npx tsx scripts/send-reader-notice.ts --to a@b.com # send to one address only
 *
 * Requires in .env:
 *   DATABASE_URL     — Neon Postgres (better-auth user table lives here)
 *   RESEND_API_KEY   — Resend HTTP API key from a verified akshar.ashifcodes.tech
 *                      domain
 *
 * Sends from no-reply@akshar.ashifcodes.tech with Reply-To md.ashif.dev@gmail.com.
 */

const FROM_EMAIL = "no-reply@akshar.ashifcodes.tech";
const REPLY_TO = "md.ashif.dev@gmail.com";
const SUBJECT = "Akshar — A Notice to Our Readers";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Akshar — A Notice to Our Readers</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f3ef; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#242424;">

  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    A notice regarding incorrect book content recently available on Akshar.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3ef; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background:#ffffff; border-radius:14px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:34px 42px 28px; border-bottom:1px solid #eeeae4;">

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:28px; line-height:32px; font-weight:600; color:#171717;">
                      Akshar
                    </div>
                  </td>

                  <td align="right" style="font-size:12px; color:#8a857d; letter-spacing:0.08em; text-transform:uppercase;">
                    2026
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:46px 42px 42px;">

              <div style="font-size:12px; line-height:18px; color:#8a857d; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:18px;">
                A note to our readers
              </div>

              <h1 style="margin:0 0 24px; font-family:Georgia, 'Times New Roman', serif; font-size:32px; line-height:40px; font-weight:500; color:#171717;">
                We're sorry.
              </h1>

              <p style="margin:0 0 18px; font-size:16px; line-height:28px; color:#45413c;">
                We recently discovered that some books on Akshar contained content that did not correctly correspond to their listed titles.
              </p>

              <p style="margin:0 0 18px; font-size:16px; line-height:28px; color:#45413c;">
                This was an error on our end, and we sincerely apologize for the inconvenience and confusion it may have caused.
              </p>

              <!-- Highlight -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
                <tr>
                  <td style="border-left:3px solid #252525; padding:4px 0 4px 20px;">

                    <p style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:18px; line-height:28px; color:#292622;">
                      The affected content has been reviewed and corrected at the earliest opportunity after we became aware of the issue.
                    </p>

                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px; font-size:16px; line-height:28px; color:#45413c;">
                We take the accuracy and reliability of the books available on Akshar seriously. We are also reviewing our content verification process to help prevent similar issues in the future.
              </p>

              <p style="margin:0 0 30px; font-size:16px; line-height:28px; color:#45413c;">
                If you come across any incorrect content, technical issue, or anything else that doesn't seem right, please let us know. Your feedback helps us improve Akshar.
              </p>

              <!-- Contact -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5f1; border-radius:10px;">
                <tr>
                  <td style="padding:22px 24px;">

                    <div style="font-size:12px; line-height:18px; color:#8a857d; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px;">
                      Contact
                    </div>

                    <a href="mailto:md.ashif.dev@gmail.com"
                       style="font-size:15px; line-height:22px; color:#222222; text-decoration:none; font-weight:500;">
                      md.ashif.dev@gmail.com
                    </a>

                  </td>
                </tr>
              </table>

              <p style="margin:30px 0 0; font-size:13px; line-height:22px; color:#8a857d;">
                Please do not reply to this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 42px 34px; border-top:1px solid #eeeae4;">

              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:24px; color:#292622;">
                A quieter place to read.
              </div>

              <div style="margin-top:10px; font-size:12px; line-height:20px; color:#9a958e;">
                © 2026 Akshar. All rights reserved.
              </div>

            </td>
          </tr>

        </table>

        <!-- Outside Card -->
        <div style="max-width:620px; padding:20px 20px 0; font-size:11px; line-height:18px; color:#aaa49c;">
          This is an automated service communication from Akshar.
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;

interface Recipient {
  id: string;
  name: string;
  email: string;
}

async function fetchRecipients(onlyEmail?: string): Promise<Recipient[]> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT id, name, email FROM "user" ORDER BY email`;
  const recipients = rows.map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email).toLowerCase(),
  }));
  return onlyEmail
    ? recipients.filter((r) => r.email === onlyEmail.toLowerCase())
    : recipients;
}

async function sendEmail(recipient: Recipient): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [recipient.email],
      reply_to: REPLY_TO,
      subject: SUBJECT,
      html: HTML,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  const data: any = await res.json();
  return data.id;
}

function parseArgs(args: string[]): { dryRun: boolean; onlyEmail?: string } {
  const dryRun = args.includes("--dry-run");
  let onlyEmail: string | undefined;
  args.forEach((a, i) => {
    if (a === "--to" && args[i + 1]) onlyEmail = args[i + 1];
  });
  return { dryRun, onlyEmail };
}

async function main() {
  const { dryRun, onlyEmail } = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!dryRun && !process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set (use --dry-run to skip sending)");
  }

  const recipients = await fetchRecipients(onlyEmail);
  if (recipients.length === 0) {
    console.log("No recipients found.");
    return;
  }

  console.log(
    `\nRecipients (${recipients.length}):\n` +
      recipients.map((r) => `  ${r.email} (${r.name})`).join("\n") +
      "\n"
  );

  if (dryRun) {
    console.log("Dry run — no emails sent.");
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      const id = await sendEmail(r);
      sent++;
      console.log(`  sent -> ${r.email} (${id})`);
    } catch (err) {
      failed++;
      console.error(`  FAILED -> ${r.email}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});