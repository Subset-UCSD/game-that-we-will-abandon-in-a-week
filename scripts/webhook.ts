/**
 * @file
 * called by webhook workflow
 */

import z from "zod"

// https://docs.github.com/en/webhooks/webhook-events-and-payloads#push

const discordWebhook = process.env.DISCORD_WEBHOOK
const commitsJson = process.env.COMMITS
if (!discordWebhook) {
  console.error('missing env var DISCORD_WEBHOOK')
  process.exit(1)
}
if (!commitsJson) {
  console.error('missing env var COMMITS')
  process.exit(1)
}

const commitSchema = z.object({
  author: z.object({
    email: z.string().nullable(),
    name: z.string(),
    username: z.string().optional()
  }),
  message: z.string()
}).array()

const commits = commitSchema.parse(JSON.parse(commitsJson))

// {
//   "content": "sdfsdf",
//   "username": "sdfsdf",
//   "avatar_url": null,
//   "tts": false,
//   "embeds": [
//     {
//       "title": "dfgdfgdfg",
//       "description": "sdfsdfsdfsdf",
//       "url": null,
//       "timestamp": null,
//       "footer": { "text": "dfgdfg", "icon_url": null },
//       "image": { "url": null },
//       "thumbnail": { "url": null },
//       "author": { "name": "dfgdfg", "url": null, "icon_url": null },
//       "fields": [{ "name": "dfgdfg", "value": "dfgdfg", "inline": true }]
//     }
//   ]
// }


const content = ''

await fetch(discordWebhook, {
  headers: {'content-type': 'application/json'},
  method:'POST',
  body: JSON.stringify({
    embeds: commits.map(({message, author: {username,name}}) => ({
      description: message,
      author: {
        // is guy gender neutral
        name: username ?? `some guy named ${name}`
      }
    }))
  })
})
