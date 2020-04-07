# tRPI Authentication Bot

Simple Discord bot for authenticating RPI students in the teamRPI Discord Server

## Setup

Run `npm install` for each of these dependencies:

- discord.js@11.5.1 (other versions will break the bot. you can refactor if you want, though)
- nodemailer
- dotenv

Put these values in a `.env` file in the root folder:

| Environmental Variables |                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `GUILD`                 | guild id for the server. Can be found by rightclicking the server and clicking "Copy ID"           |
| `CHANNEL`               | channel id the bot will reside in. Can be found by rightlicking the channel and clicking "Copy ID" |
| `TOKEN`                 | the bot's api token. Can be found/created in the discord developer portal                          |
| `USER`                  | email address that sends the verification emails                                                   |
| `PASS`                  | password for the email address                                                                     |

_If using a gmail account for the email, you'll need to sign into it on a browser first before running the code_

To start, run `node main.js`
