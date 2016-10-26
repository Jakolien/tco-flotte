import nodemailer from 'nodemailer';
// Create
export default nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  secure: true,
  post: 465,
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  }
});
