import { CommandHandlerParams } from "../common"
import { DB, DBEntry } from "../db"

export function linksCommand(ctx: CommandHandlerParams): void {
  if (ctx.chat.type == "private")
    console.log(`Got /links from ${ctx.chat.username}`)

  try {
    showLinks(ctx)
  } catch (e) {
    console.log(e)
  }
}

export function showLinks(ctx: CommandHandlerParams): void {
  const links = DB.getData("/links").map((obj: DBEntry) => obj.complete)
  const messages = [""]
  let length = 0
  for (const link of links) {
    if (length + link.length > 4000) {
      messages.push("")
      length = 0
    }
    messages[messages.length - 1] = messages[messages.length - 1].concat(
      "\n",
      link
    )
    length += link.length
  }
  if (messages[0]) {
    messages.forEach((message) => {
      ctx.reply(message)
    })
  } else {
    ctx.reply("Nessun link salvato.")
  }
}
