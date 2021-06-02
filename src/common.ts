import { Context, NarrowedContext } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"
import { DB, DBEntry } from "./db"
import { fixLinkProtocol } from "./utils"

export type CommandHandlerParams = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage
    update_id: number
  }
>
export type HandlerFn = (ctx: CommandHandlerParams) => void
export type UnknownFunction = <T = unknown, R = unknown>(
  args?: T
) => R | void | null

/**
 * Risponde al messaggio con lo sticker di jetop_it "🙏"
 */

export function replyWithSticker(
  ctx: CommandHandlerParams,
  sticker: string
): void {
  ctx.replyWithSticker(sticker, { reply_to_message_id: ctx.message.message_id })
}

export function extractLinkFromMessage(message: Message.TextMessage): string {
  const urlEntity = message.entities?.find((e) => e.type == "url")
  if (!urlEntity) return ""
  const start = urlEntity.offset
  const stop = start + urlEntity.length
  return fixLinkProtocol(message.text.slice(start, stop))
}

/**
 * Controlla se un link è già stato inviato
 */
export function checkMessageWithLink(message: Message.TextMessage): {
  newLink?: string
  oldLink?: DBEntry
  err: boolean
} {
  const newLink = extractLinkFromMessage(message)
  if (!newLink) return { err: true }
  const { host, pathname } = new URL(newLink)
  const links = DB.getData("/links")

  return {
    newLink: newLink,
    oldLink: links.find((e: DBEntry) => e.host == host && e.path == pathname),
    err: false,
  }
}
