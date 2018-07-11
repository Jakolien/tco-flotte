import nodemailer from 'nodemailer';
// TODO: create account?
export default nodemailer.createTransport({
  host: process.env.FLOTTENRECHNER_MAIL_HOST || 'localhost',
  secure: true,
  post: process.env.FLOTTENRECHNER_MAIL_PORT || 465,
  auth: {
    user: process.env.FLOTTENRECHNER_MAIL_USERNAME,
    pass: process.env.FLOTTENRECHNER_MAIL_PASSWORD
  }
});
