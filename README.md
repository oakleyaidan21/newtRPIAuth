# tRPI Authentication Bot

Discord bot for authenticating RPI students in the tRPI Discord Server

## Setup

Run `npm install`

Put these values in a `.env` file in the root folder:

| Environmental Variables |                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `GUILD`                 | guild id for the server. Can be found by rightclicking the server and clicking "Copy ID"           |
| `CHANNEL`               | channel id the bot will reside in. Can be found by rightlicking the channel and clicking "Copy ID" |
| `TOKEN`                 | the bot's api token. Can be found/created in the discord developer portal                          |
| `USER`                  | email address that sends the verification emails                                                   |
| `PASS`                  | password for the email address                                                                     |

To start, run `node main.js`
