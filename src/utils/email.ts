import nodemailer from 'nodemailer';

const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  //1) Create a transporter
  const transporter = nodemailer.createTransport({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option
  });
  //2) Define the email options
  const maillOptions = {
    from: 'Mouhib Sahloul <mouhib@hotmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3) Actually send the email
  await transporter.sendMail(maillOptions);
};
export default sendEmail;
