const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'CampusHive <noreply@placementor.xyz>',
      to,
      subject,
      html,
    });
    console.log("Email sent successfully ✅");
  } catch (error) {
    console.log("Email error ❌:", error.message);
  }
};

module.exports = sendEmail;
