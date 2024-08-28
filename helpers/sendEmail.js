import nodemailer from "nodemailer";
import "dotenv/config";

const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, BASE_URL } = process.env;

const emailTransport = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

export const sendEmail = (data) =>
  emailTransport.sendMail({ ...data, from: MAIL_USER });

export const getVerifyEmailData = ({ email, verificationToken }) => ({
  to: email,
  subject: "Verify email",
  html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationToken}">Verify email</a>`,
});
