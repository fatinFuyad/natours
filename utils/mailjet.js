const Mailjet = require("node-mailjet");

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);
// const mailjet = require("node-mailjet").connect(
//   process.env.MAILJET_API_KEY,
//   process.env.MAILJET_API_SECRET
// );

exports.EmailRequest = async function (mailOptions) {
  const { from, to, subject, html, text } = mailOptions;
  console.log("sending mail...");
  return mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: from.email,
          Name: from.name,
        },
        To: [
          {
            Email: to.email,
            Name: to.firstName,
          },
        ],
        Subject: subject,
        TextPart: text,
        HTMLPart: html,
      },
    ],
  });
};

// EmailRequest(
//   {
//     from: {
//       name: "Admin | Natours",
//       email: "fuyad5266@gmail.com",
//     },
//     to: {
//       name: "User Fatin",
//       email: "fatinfuyad00@gmail.com",
//     },
//     subject: "Your password reset token (valid for only 10 mins)",
//   },
//   "http://127.0.0.1:8000/me"
// );

// request
//   .then((result) => {
//     console.log(result.body);
//   })
//   .catch((err) => {
//     console.log(err.statusCode);
//   });
