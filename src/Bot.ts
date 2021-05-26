import axios from 'axios'
import { Telegraf } from 'telegraf'
import { Message } from 'telegraf/typings/core/types/typegram'
import { checkCommand } from './commands/checkCommand'
import { linksCommand } from './commands/linksCommand'
import { rebuildCommand } from './commands/rebuildCommand'
import { sendCommand } from './commands/sendMessageToGroup'
import { startCommand } from './commands/startCommand'
import { testCommand } from './commands/testCommand'
import { checkMessageWithLink, CommandHandlerParams, extractLinkFromMessage, HandlerFn, replyWithSticker } from './common'
import { ADMIN_ID, GROUP_ID, stickers } from './constants'
import { addNewLink, DB } from './db'
import { OMG } from "./OMG"
import { rebuildFromHistory } from './rebuildFromHistory'
import { randomNumber } from './utils'
import { veryFunnyMessagesAboutFlutter } from "./veryFunnyMessagesAboutFlutter"

export const bot = new Telegraf(process.env.BOT_TOKEN || "")
const Omg = new OMG()

bot.telegram.setMyCommands([
  { command: "/start", description: "Messaggio iniziale." },
  { command: "/links", description: "Invia tutti i link salvati." },
  { command: "/check", description: "Controlla che un link non sia già stato inviato." },
])

console.log("Starting.")
sendMessageToAdmin("Sono stato riavviato.")

const COMMANDS: { [i: string]: HandlerFn } = {
  '/start': startCommand,
  '/test': testCommand,
  '/links': linksCommand,
  '/rebuild': rebuildCommand,
  '/check': checkCommand,
  '/send': sendCommand
}

bot.command('/omg', (ctx) => {
  console.log("Set OMG.")
  Omg.omg(() => null)
})

for (const c in COMMANDS) {
  bot.command(c, COMMANDS[c])
}

bot.on(['text', 'document'], (ctx) => {
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
function handleMessage(message: Message.DocumentMessage | Message.TextMessage, ctx: CommandHandlerParams) {
  if (message.chat.id === GROUP_ID) {
    handleMessageFromGroup(message, ctx)
  } else {
    handlePrivateMessage(message)
    if (DB.getData('/admin/DB/rebuilding/inProgress'))
      DB.push('/admin/DB/rebuilding/inProgress', false)
  }

}

function handleMessageFromGroup(message: Message.TextMessage | Message.DocumentMessage, ctx: CommandHandlerParams) {
  if (!('text' in message)) return;

  if (message.text.match(/flutter/img)) {
    replyWithMarkdown(message, veryFunnyMessagesAboutFlutter[randomNumber(0, veryFunnyMessagesAboutFlutter.length)])
  }
  else if (extractLinkFromMessage(message)) {
    messageFromGroupWithLink(message, ctx)
  } else {
    normalMessageFromGroup(message, ctx)
  }
}

function normalMessageFromGroup(message: Message.TextMessage, ctx: CommandHandlerParams) {
  console.log('Normal message.')
  if (message.text?.match(/good\sbot/img)) {
    console.log("Good bot 🤩")
    replyToGoodBot(ctx)
  } else if (message.text?.match(/bad\sbot/img)) {
    console.log("Bad bot 😥")
    replyToBadBot(ctx)
  }
}

function messageFromGroupWithLink(message: Message.TextMessage, ctx: CommandHandlerParams) {
  if (message.from?.username == "pow_ext") {
    console.log("Got link from Simone")
    Omg.omg(() =>
      replyWithSticker(ctx,
        stickers.thankYouLord)
    )(message)
    checkMessageWithLink(message)
  } else {
    const { newLink, oldLink, err } = checkMessageWithLink(message)
    if (oldLink) {
      ctx.reply("🟡Cartellino Giallo!🟡\nLink già inviato.")
      ctx.reply("🔼", { reply_to_message_id: oldLink.id })
    } else if (newLink) {
      console.log("Got new link.")
      newLinkFromGroup(newLink)
    }
  }
}

function replyToBadBot(ctx: CommandHandlerParams) {
  replyWithSticker(ctx,
    stickers.badBot)
}

function replyToGoodBot(ctx: CommandHandlerParams) {
  replyWithSticker(ctx,
    stickers.goodBot)
}

/**
 * Step da eseguire quando si riceve un nuovo link nel gruppo.
 * Aggiunge un link al db.
 */
function newLinkFromGroup(link: string) {
  addNewLink(link)
}


/**
 * Gestisce un messaggio in privato, 
 */
function handlePrivateMessage(message: Message.TextMessage | Message.DocumentMessage) {
  const rebuilding = DB.getData('/admin/DB/rebuilding')
  if (rebuilding.inProgress && rebuilding.chatId == message.chat.id) {
    rebuildDatabase(message)
  }
}

/**
 * Ricostruisce il DB a partire da un messaggio con una lista di link
 */
async function rebuildDatabase(message: Message.TextMessage | Message.DocumentMessage) {
  console.log("Rebuilding database.")
  if (!('document' in message)) {
    console.log("Invalid message.")
    return
  }
  DB.push("/links", [])
  const { document } = message
  const { file_id: fileId } = document
  const fileUrl = await bot.telegram.getFileLink(fileId);
  const response = await axios.get(fileUrl.href);
  rebuildFromHistory(response.data)
  bot.telegram.sendMessage(message.chat.id, `Completato!\nLink nel DB: ${DB.count('/links')}`)
}

/**
 * Risponde al messaggio con un messaggio testuale
 */
function replyWithMarkdown(message: Message.TextMessage, textAnswer: string) {
  bot.telegram.sendMessage(
    message.chat.id,
    textAnswer,
    { parse_mode: 'HTML' }
  )
}

export function sendMessageToAdmin(text: string) {
  bot.telegram.sendMessage(ADMIN_ID, text)
}