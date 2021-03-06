import axios from "axios"
import { Telegraf } from "telegraf"
import { Message } from "telegraf/typings/core/types/typegram"
import { cannedResponses } from "./cannedResponses"
import { checkCommand } from "./commands/checkCommand"
import { linksCommand } from "./commands/linksCommand"
import { omgCommand } from "./commands/omgCommand"
import { addCommand } from "./commands/addCommand"
import { sendCommand } from "./commands/sendMessageToGroup"
import { startCommand } from "./commands/startCommand"
import { testCommand } from "./commands/testCommand"
import {
  checkMessageWithLink,
  CommandHandlerParams,
  extractLinkFromMessage,
  HandlerFn,
  replyWithSticker,
} from "./common"
import { ADMIN_ID, GROUP_ID, stickers } from "./constants"
import { addNewLink, DB } from "./db"
import { OMG } from "./OMG"
import { getLinksFromHistory as getLinksFromHistory } from "./rebuildFromHistory"
import { randomNumber } from "./utils"
import { resetCommand } from "./commands/resetCommand"

export const bot = new Telegraf(process.env.BOT_TOKEN || "")
export const Omg = new OMG()

bot.telegram.setMyCommands([
  { command: "/start", description: "Messaggio iniziale." },
  { command: "/links", description: "Invia tutti i link salvati." },
  {
    command: "/check",
    description: "Controlla che un link non sia già stato inviato.",
  },
])

console.log("Starting.")
sendMessageToAdmin("Sono stato riavviato.")

const COMMANDS: { [i: string]: HandlerFn } = {
  "/start": startCommand,
  "/test": testCommand,
  "/links": linksCommand,
  "/add": addCommand,
  "/reset": resetCommand,
  "/check": checkCommand,
  "/send": sendCommand,
  "/omg": omgCommand,
}

for (const [command, handler] of Object.entries(COMMANDS)) {
  bot.command(command, handler)
}

bot.on(["text", "document"], (ctx) => {
  try {
    const message = ctx.update.message
    handleMessage(message, <CommandHandlerParams>ctx)
  } catch (e) {
    console.log(e)
  }
})

/**
 * Controlla se il gruppo è quello giusto tramite ID della chat,
 * che il messaggio sia di Simone e che contenga un link.
 * In tal caso chiama OMG per rispondere al messaggio.
 */
function handleMessage(
  message: Message.DocumentMessage | Message.TextMessage,
  ctx: CommandHandlerParams
) {
  if (message.chat.id === GROUP_ID) {
    handleMessageFromGroup(message, ctx)
  } else {
    handlePrivateMessage(message)
    if (DB.getData("/admin/DB/rebuilding/inProgress"))
      DB.push("/admin/DB/rebuilding/inProgress", false)
  }
}

function handleMessageFromGroup(
  message: Message.TextMessage | Message.DocumentMessage,
  ctx: CommandHandlerParams
) {
  if (!("text" in message)) return

  checkForCannedResponse(message)

  if (extractLinkFromMessage(message)) {
    messageFromGroupWithLink(message, ctx)
  } else {
    normalMessageFromGroup(message, ctx)
  }
}

function checkForCannedResponse(message: Message.TextMessage) {
  for (const behaviour of cannedResponses) {
    const [regexp, responses] = behaviour
    if (message.text.match(regexp)) {
      replyWithMarkdown(message, responses[randomNumber(0, responses.length)])
    }
  }
}

function normalMessageFromGroup(
  message: Message.TextMessage,
  ctx: CommandHandlerParams
) {
  console.log("Normal message.")
  if (message.text.match(/good\sbot/gim)) {
    console.log("Good bot 🤩")
    replyToGoodBot(ctx)
  } else if (message.text.match(/bad\sbot/gim)) {
    console.log("Bad bot 😥")
    replyToBadBot(ctx)
  }
}

function messageFromGroupWithLink(
  message: Message.TextMessage,
  ctx: CommandHandlerParams
) {
  if (message.from?.username == "pow_ext") {
    console.log("Got link from Simone")
    Omg.omg(() => replyWithSticker(ctx, stickers.thankYouLord))(message)
    checkMessageWithLink(message)
  } else {
    const { newLink, oldLink } = checkMessageWithLink(message)
    if (oldLink) {
      ctx.reply("🟡Cartellino Giallo!🟡\nLink già inviato.")
      ctx.reply("🔼", { reply_to_message_id: oldLink.id })
    } else if (newLink) {
      console.log("Got new link.")
      addNewLink(newLink)
    }
  }
}

function replyToBadBot(ctx: CommandHandlerParams) {
  replyWithSticker(ctx, stickers.badBot)
}

function replyToGoodBot(ctx: CommandHandlerParams) {
  replyWithSticker(ctx, stickers.goodBot)
}

/**
 * Gestisce un messaggio in privato,
 */
function handlePrivateMessage(
  message: Message.TextMessage | Message.DocumentMessage
) {
  const rebuilding = DB.getData("/admin/DB/rebuilding")
  if (rebuilding.inProgress && rebuilding.chatId == message.chat.id) {
    addLinksFromFile(message)
  }
  if ("text" in message) checkForCannedResponse(message)
}

/**
 * Ricostruisce il DB a partire da un messaggio con una lista di link
 */
async function addLinksFromFile(
  message: Message.TextMessage | Message.DocumentMessage
) {
  console.log("Adding links.")
  if (!("document" in message)) {
    console.log("Invalid message.")
    return
  }
  const { document } = message
  const { file_id: fileId } = document
  const fileUrl = await bot.telegram.getFileLink(fileId)
  const response = await axios.get(fileUrl.href)
  getLinksFromHistory(response.data)
  bot.telegram.sendMessage(
    message.chat.id,
    `Completato!\nLink nel DB: ${DB.count("/links")}`
  )
}

/**
 * Risponde al messaggio con un messaggio testuale
 */
function replyWithMarkdown(message: Message.TextMessage, textAnswer: string) {
  bot.telegram.sendMessage(message.chat.id, textAnswer, { parse_mode: "HTML" })
}

export function sendMessageToAdmin(text: string): void {
  bot.telegram.sendMessage(ADMIN_ID, text)
}
