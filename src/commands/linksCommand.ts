import { Context, NarrowedContext } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { CommandHandlerParams } from '../common';
import { DB, DBEntry } from '../db';

export function linksCommand(ctx: CommandHandlerParams) {
  if (ctx.chat.type == 'private')
    console.log(`Got /links from ${ctx.chat.username}`);

  try {
    showLinks(ctx);
  } catch (e) {
    console.log(e);
  }
}

export function showLinks(ctx: CommandHandlerParams
) {
  const links = DB.getData("/links").map((obj: DBEntry) => obj.complete)
  const messages = [""]
  let length = 0
  for (let link of links) {
    if (length + link.length > 4000) {
      messages.push("")
      length = 0
    }
    messages[messages.length - 1] = messages[messages.length - 1].concat("\n", link)
    length += link.length
  }
  if (messages[0]) {
    messages.forEach(message => {
      ctx.reply(message)
    })
  } else {
    ctx.reply("Nessun link salvato.")
  }
}