const Discord = require("discord.js");
const client = new Discord.Client();
const nodemailer = require("nodemailer");
require("dotenv").config();

var guildID = process.env.GUILD;
var channelID = process.env.CHANNEL;
var currentUsers = [];
/**
 *
 *
 * HELPER FUNCTIONS
 *
 */

//creates a code for the user to verify themselves with
String.prototype.hashCode = function () {
  var hash = 0;
  if (this.length == 0) {
    return hash;
  }
  for (var i = 0; i < this.length; i++) {
    var char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
};

//emails the entered email their verification id
async function email(email, id) {
  //get code
  let code = email.hashCode();
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });
  try {
    let info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: "Team RPI Verification",
      text:
        "Send this code back to the bot. If there is a '-' at the beginning of the code, include that when you copy the code.\n" +
        code,
    });
    console.log("message sent: %s", info.messageId);
    currentUsers.push({ id: id, code: code });
    console.log(currentUsers);
    return true;
  } catch (error) {
    console.log("error sending email,", error);
    return false;
  }
}

function checkUsersById(id) {
  for (let i = 0; i < currentUsers.length; i++) {
    if (currentUsers[i].id === id) {
      return i;
    }
  }
  return -1;
}

function checkUsersByCode(code) {
  for (let i = 0; i < currentUsers.length; i++) {
    if (currentUsers[i].code === code) {
      return i;
    }
  }
  return -1;
}

function checkRegistered(message) {
  let role = message.guild.roles.find((role) => role.name === "Student");
  if (role) {
    if (message.member.roles.has(role.id)) {
      return true;
    }
  }
  return false;
}

/**
 *
 *
 * BOT CODE
 *
 */
client.on("ready", () => {
  console.log("Connected as " + client.user.tag);
});

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.TOKEN;

//get bot ready
client.on("ready", () => {
  console.log("bot is ready");
});

//on member joining
client.on("guildMemberAdd", (member) => {
  console.log("member joined");
  const channel = member.guild.channels.find((ch) => ch.name === "bot-channel");
  if (!channel) {
    console.log("failed channel search");
    return;
  }
  channel.send(
    "Welcome, <@" +
      member.id +
      ">! Type `!register` to receive verification instructions in your DMs. It might take a second for you to receive the message, so don't spam it."
  );
});

//on receiving a message
client.on("message", (receivedMessage) => {
  let user =
    receivedMessage.author.username +
    "#" +
    receivedMessage.author.discriminator;
  // Prevent bot from responding to its own messages
  if (receivedMessage.author == client.user) {
    return;
  }

  //if in the bot channel
  if (receivedMessage.channel.id === channelID) {
    if (receivedMessage.content.includes("!register")) {
      console.log("!register from user:", user);
      //check if they're already registered
      if (checkRegistered(receivedMessage)) {
        receivedMessage.channel.send("Hey, you already are verified!");
        return;
      }
      //send the message to the user
      receivedMessage.author.send(
        "Please enter your full RPI e-mail address (ex: `jsmith@rpi.edu`)"
      );
      return;
    }
  }

  //check for DM commands
  if (receivedMessage.channel.type === "dm") {
    console.log("dm from user:", user, "content:", receivedMessage.content);
    //check to see if they already have the student role
    //check code they sent
    if (receivedMessage.content[0] === "?") {
      let id = checkUsersByCode(
        parseInt(
          receivedMessage.content.slice(0, 0) + receivedMessage.content.slice(1)
        )
      );
      if (id !== -1) {
        //give them role in server
        let guild = client.guilds.get(guildID);

        let role = guild.roles.find((r) => r.name == "Student");
        let member = guild.members.find(
          (m) => m.user.username === receivedMessage.author.username
        );
        member.addRole(role).catch(console.error);

        //remove them from current users
        currentUsers.splice(id, 1);

        //send a message
        receivedMessage.author.send("Verified!");
        return;
      } else {
        receivedMessage.author.send(
          "Invalid code. Are you sure it matches the one sent to you?"
        );
        return;
      }
    }
    if (receivedMessage.content.includes("@rpi.edu")) {
      //check if they're in the current list of users
      // if (checkUsersById(receivedMessage.author.id) !== -1) {
      //   receivedMessage.author.send(
      //     "There should already be a verification email in your inbox. Have you tried checking your spam? If it seems it wasn't sent at all, message @CarrotCake#1337"
      //   );
      //   return;
      // }
      //send email and add them to the current users
      if (!email(receivedMessage.content, receivedMessage.author.id)) {
        receivedMessage.author.send(
          "An error occurred, shoot @CarrotCake#1337 a message"
        );
        return;
      }

      //give message
      receivedMessage.author.send(
        "Sent verification check to " +
          receivedMessage.content +
          ". Check your e-mail! Please enter the code you received, proceeded by an `?`. (ex: `?826380418`)"
      );

      return;
    }
  }
});

//login
client.login(bot_secret_token);
