import { Message } from "telegraf/typings/core/types/typegram"
import { CommandHandlerParams } from "../common"
import { ADMIN_ID, GROUP_ID } from "../constants"

export function sendCommand(ctx: CommandHandlerParams): void {
  if (ctx.message.chat.id != ADMIN_ID) return
  const message = ctx.update.message
  const { text, entities } = parseText(message)
  ctx.reply(text, { entities: entities })
  ctx.telegram.sendMessage(GROUP_ID, text, { entities: entities })
}

function parseText(msg: Message.TextMessage) {
  const re = /\/send\s*\n/i
  const trash = msg.text.match(re)?.shift()
  const text = msg.text.replace(re, "")

  let entities = msg.entities
  if (entities) {
    entities?.shift()
    entities = entities.map((entity) => {
      entity.offset -= trash?.length || 0
      return entity
    })
  }
  return { text, entities }
}
