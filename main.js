const Discord = require("discord.js");
const client = new Discord.Client();
const nodemailer = require("nodemailer");
const firebase = require("firebase");
const firestore = require("firebase/firestore");
const config = require("./firebaseConfig").config;
require("dotenv").config();

var guildID = process.env.GUILD;
var channelID = process.env.CHANNEL;
var currentUsers = [];
firebase.initializeApp(config);
var db = firebase.firestore();
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

function checkUsersByCode(code, unverifiedUsers) {
  for (let i = 0; i < unverifiedUsers.length; i++) {
    if (unverifiedUsers[i].hashCode === code) {
      return unverifiedUsers[i];
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
  let user = {
    id: member.user.id,
    username: member.user.username,
    avatar: member.user.avatar,
    discriminator: member.user.discriminator,
  };
  console.log("user:", user);
  db.collection("welcomedUsers").doc(member.user.id).set(user);
});

//on member leaving
client.on("guildMemberRemove", (member) => {
  console.log("member left");
  let user = {
    id: member.user.id,
    username: member.user.username,
    avatar: member.user.avatar,
    discriminator: member.user.discriminator,
  };
  //remove from every table
  console.log("id", member.user.id);
  db.collection("verifiedUsers")
    .doc(member.user.id)
    .delete()
    .then(() => {
      console.log(member.user.username, "removed from verifiedUsers");
    });
  db.collection("unverifiedUsers")
    .doc(member.user.id)
    .delete()
    .then(() => {
      console.log(member.user.username, "removed from unverifiedUsers");
    });
  db.collection("welcomedUsers")
    .doc(member.user.id)
    .delete()
    .then(() => {
      console.log(member.user.username, "removed from welcomedUsers");
    });
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
    //check code they sent
    if (receivedMessage.content[0] === "?") {
      //check if they already have the roll
      //get unverifiedUsers
      db.collection("unverifiedUsers")
        .get()
        .then((ref) => {
          let unverfiedUsers = ref.docs.map((doc) => doc.data());
          // console.log("unverified", unverfiedUsers);
          //find them in the data
          let id = checkUsersByCode(
            parseInt(
              receivedMessage.content.slice(0, 0) +
                receivedMessage.content.slice(1)
            ),
            unverfiedUsers
          );
          if (id !== -1) {
            console.log("id:", id);
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

            //remove them from unverifiedUsers and add them to verified users
            db.collection("unverifiedUsers")
              .doc(id.id)
              .delete()
              .then(() => {
                console.log("removed from unverified users");
                db.collection("verifiedUsers")
                  .doc(id.id)
                  .set({ ...id })
                  .then(() => {
                    console.log("added to verified users");
                  });
              });
            return;
          } else {
            receivedMessage.author.send(
              "Invalid code. Are you sure it matches the one sent to you?"
            );
            return;
          }
        });
    }
    if (receivedMessage.content.includes("@rpi.edu")) {
      //remove them from welcomedUsers
      db.collection("welcomedUsers")
        .doc(receivedMessage.author.id)
        .delete()
        .then(() => {
          console.log(
            "removed",
            receivedMessage.author.username,
            "from welcomedUsers and moved them to unverifiedUsers"
          );
        });
      //once added to the verified users list, they will be sent an email by firestore
      db.collection("unverifiedUsers")
        .doc(receivedMessage.author.id)
        .set({
          id: receivedMessage.author.id,
          username: receivedMessage.author.username,
          avatar: receivedMessage.author.avatar,
          discriminator: receivedMessage.author.discriminator,
          hashCode: receivedMessage.content.hashCode(),
        })
        .then(() => {
          console.log(
            "added",
            receivedMessage.author.username,
            "to unverfiedUsers"
          );
          //send email
          db.collection("mail")
            .add({
              to: receivedMessage.content,
              message: {
                subject: "Team RPI Discord Verification",
                text:
                  "Send this code back to the bot. If there is a '-' at the beginning of the code, include that when you copy the code.\n" +
                  receivedMessage.content.hashCode(),
              },
            })
            .then(() => {
              console.log("sent email to", receivedMessage.content);
              receivedMessage.author.send(
                "Sent verification check to " +
                  receivedMessage.content +
                  ". Check your e-mail! Please enter the code you received, proceeded by an `?`. (ex: `?826380418`)"
              );
            });
        });

      return;
    }
  }
});

//login
client.login(bot_secret_token);
