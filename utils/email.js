const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const { EmailRequest } = require("./mailjet");

class Email {
  constructor(user, url) {
    this.to = user.email; // test email "fatinfuyad00@gmail.com";
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  async mailTransport(mailOptions) {
    if (process.env.NODE_ENV === "production") {
      return await EmailRequest(mailOptions);
      // return { sendMail: EmailRequest };
      // return "Twillo/SendGrid Email";
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
        // activate in gmail "less secure app" option
      },
    });
  }

  async send(template, subject) {
    // 1) render html from pug and also as text
    const emailHtml = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });

    // 2) define the email options
    const mailOptions = {
      from: { email: this.from, name: "Admin | Natours" },
      to: { email: this.to, name: this.firstName },
      subject,
      html: emailHtml,
      text: htmlToText.convert(emailHtml),
    };

    // 3) create a transporter
    // await this.mailTransport().sendMail(mailOptions); // using nodemailer transport
    await this.mailTransport(mailOptions); // use mailjet
    console.log("sent mail");
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome for creating account🎉");
  }

  async sendResetPassword() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 mins)"
    );
  }
}

module.exports = Email;

//////////
// privous dev way of sending mail

// const sendEmail = async (options) => {
//   // 1) create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//       // activate in gmail "less secure app" option
//     },
//   });
//   // 2) define the email options
//   const mailOptions = {
//     from: "fatinFuyad <fatinfuyad00@gmail.com>",
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   // 3) actually send the email
//   await transporter.sendMail(mailOptions);
// };
