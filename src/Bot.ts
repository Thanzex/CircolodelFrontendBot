import axios from 'axios'
import { Context, NarrowedContext, Telegraf } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { addNewLink, DB, DBEntry } from './Db'
import { OMG } from "./OMG"
import { rebuildFromHistory } from './rebuildFromHistory'
import { fixLinkProtocol, randomNumber } from './utils'
import { veryFunnyMessagesAboutFlutter } from "./veryFunnyMessagesAboutFlutter"

export const bot = new Telegraf(process.env.BOT_TOKEN || "")
const Omg = new OMG()


const ADMIN_ID = 644826120;
const GROUP_ID = ADMIN_ID;

bot.telegram.setMyCommands([
  { command: "/start", description: "Messaggio iniziale." },
  { command: "/links", description: "Invia tutti i link salvati." },
  { command: "/check", description: "Controlla che un link non sia già stato inviato." },
])

bot

console.log("Starting.")
sendMessageToAdmin("Sono stato riavviato.")

bot.command('/start', (ctx) => {
  if (ctx.chat.type != 'private') return;
  console.log(`Got /start from ${ctx.chat.username} in chat ${ctx.chat.id}`)
  ctx.reply("Ciao! Sono un bot molto specifico che risponde solo a certi messaggi di Simone in CircoloDelFrontend.\nPurtroppo non ti posso essere di altro aiuto!")
})

bot.command('/test', (ctx) => {
  if (ctx.chat.type == 'private')
    console.log(`Got /test from ${ctx.chat.username}`)

  const message = ctx.update.message
  replyWithSticker(message)
})

bot.command('/omg', (ctx) => {
  console.log("Set OMG.")
  Omg.omg(() => null)
})

bot.command("/links", (ctx) => {
  if (ctx.chat.type == 'private')
    console.log(`Got /links from ${ctx.chat.username}`)

  try {
    printDB(ctx)
  } catch (e) {
    console.log(e);
  }
})

bot.command('/rebuild', (ctx) => {
  if (ctx.chat.type != 'private') return;
  try {
    console.log(`Got /rebuild from ${ctx.chat.username}`)
    DB.push('/admin/DB', {
      rebuilding: {
        inProgress: true,
        chatId: ctx.chat.id
      }
    })
  } catch (e) {
    console.log(e);
  }
})

bot.command("/check", (ctx) => {
  if (ctx.chat.type == 'private')
    console.log(`Got /check from ${ctx.chat.username}`)

  try {
    const message = ctx.update.message
    checkLink(message, false)
  } catch (e) {
    console.log(e)
  }
})

bot.command("/send", (ctx) => {
  sendMessageToGroup(ctx);
})

bot.on(['text', 'document'], (ctx) => {
  try {
    const message = ctx.update.message
    handleMessage(message)
  } catch (e) {
    console.log(e)
  }
})

function sendMessageToGroup(ctx: NarrowedContext<Context<Update>, { message: Update.New & Update.NonChannel & Message.TextMessage; update_id: number }>) {
  if (ctx.message.chat.id != ADMIN_ID) return;
  const message = ctx.update.message;
  var { text, entities } = parseText(message);
  bot.telegram.sendMessage(message.chat.id, text, { entities: entities });
  bot.telegram.sendMessage(GROUP_ID, text, { entities: entities });
}

function parseText(msg: Message.TextMessage) {
  const re = /\/send\s*\n/i;
  const trash = msg.text.match(re)!.shift()!
  const text = msg.text.replace(re, "");

  let entities = msg.entities;
  if (entities) {
    entities?.shift();
    entities = entities.map(entity => {
      entity.offset -= trash.length;
      return entity;
    });
  }
  return { text, entities };
}

/**
 * Controlla se il gruppo è quello giusto tramite ID della chat,
 * che il messaggio sia di Simone e che contenga un link.
 * In tal caso chiama OMG per rispondere al messaggio.
 *
 * @param message
 */
function handleMessage(message: Message.DocumentMessage | Message.TextMessage) {
  /**
   * Gruppo
   * -  Link
   *    - flutter praises
   *    - Link di Simone
   *    - Link normale
   *  - Messaggio normale
   *    - Good Bot 🤩
   *    - Bad Bot 😥
   * Privato
   * -  DB Rebuild
   */
  if (message.chat.id === GROUP_ID) {
    messageFromGroup(message)
  } else {
    handlePrivateMessage(message)
    if (DB.getData('/admin/DB/rebuilding/inProgress'))
      DB.push('/admin/DB/rebuilding/inProgress', false)
  }

}
function messageFromGroup(message: Message.TextMessage | Message.DocumentMessage) {
  if (!('text' in message)) return;

  if (message.text.match(/flutter/img)) {
    replyWithMarkdown(message, veryFunnyMessagesAboutFlutter[randomNumber(0, veryFunnyMessagesAboutFlutter.length)])
  }
  else if (extractLinkFromMessage(message)) {
    messageFromGroupWithLink(message)
  } else {
    normalMessageFromGroup(message)
  }
}

function normalMessageFromGroup(message: Message.TextMessage) {
  console.log('Normal message.')
  if (message.text?.match(/good\sbot/img)) {
    console.log("Good bot 🤩")
    replyToGoodBot(message)
  } else if (message.text?.match(/bad\sbot/img)) {
    console.log("Bad bot 😥")
    replyToBadBot(message)
  }
}

function messageFromGroupWithLink(message: Message.TextMessage) {
  if (message.from?.username == "pow_ext") {
    console.log("Got link from Simone")
    Omg.omg(replyWithSticker)(message)
    checkLink(message)
  } else {
    console.log("Got link from group")
    checkLink(message)
  }
}

function replyToBadBot(message: Message) {
  bot.telegram.sendSticker(
    message.chat.id,
    'CAACAgIAAxkBAAECVK5gqpLj7UZl0rsSKCbBHH1L1qlf1gACpwoAAhsViErJQuPFqV7QJh8E',
    { reply_to_message_id: message.message_id }
  );
}

function replyToGoodBot(message: Message) {
  bot.telegram.sendSticker(
    message.chat.id,
    'CAACAgIAAxkBAAECVKdgqpCUCCBzUogicaK7yqorM-RgawACNQADrWW8FPWlcVzFMOXgHwQ',
    { reply_to_message_id: message.message_id }
  );
}

/**
 * Controlla se un link è già stato inviato
 * @param message 
 */
function checkLink(message: Message.TextMessage, fromGroup = true) {
  const newLink = extractLinkFromMessage(message)
  if (!newLink) return;
  const { host, pathname } = new URL(newLink)
  const links = DB.getData("/links")

  const existingLink = links.find((e: DBEntry) => (e.host == host && e.path == pathname));
  if (existingLink) {
    console.log("Got existing link.")
    bot.telegram.sendMessage(message.chat.id, "🟡Cartellino Giallo!🟡\nLink già inviato.")
    if (fromGroup) bot.telegram.sendMessage(message.chat.id, "🔼", { reply_to_message_id: existingLink.id })
  } else if (fromGroup) {
    console.log("Got new link.")
    newLinkFromGroup(newLink)
  } else {
    bot.telegram.sendMessage(message.chat.id, "Link non ancora inviato!")
  }

}

function extractLinkFromMessage(message: Message.TextMessage) {
  const urlEntity = message.entities?.find((e) => e.type == 'url')
  if (!urlEntity) return false
  const start = urlEntity.offset
  const stop = start + urlEntity.length
  return fixLinkProtocol(message.text.slice(start, stop))
}

/**
 * Step da eseguire quando si riceve un nuovo link nel gruppo.
 * Aggiunge un link al db.
 * @param {string} link 
 */
function newLinkFromGroup(link: string) {
  addNewLink(link)
}


function printDB(ctx: NarrowedContext<Context<Update>, { message: Update.New & Update.NonChannel & Message.TextMessage; update_id: number }>) {
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
  messages.forEach(message => {
    ctx.reply(message)
  })
}

/**
 * Gestisce un messaggio in privato, 
 * @param {import('telegraf/typings/core/types/typegram').Message} message 
 */
function handlePrivateMessage(message: Message.TextMessage | Message.DocumentMessage) {
  const rebuilding = DB.getData('/admin/DB/rebuilding')
  if (rebuilding.inProgress && rebuilding.chatId == message.chat.id) {
    rebuildDatabase(message)
  }
}

/**
 * Ricostruisce il DB a partire da un messaggio con una lista di link
 * @param {message} message 
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
 * Risponde al messaggio con lo sticker di jetop_it "🙏"
 * @param {message} message 
 */
function replyWithSticker(message: Update.New & Update.NonChannel & Message.TextMessage) {
  bot.telegram.sendSticker(
    message.chat.id,
    'CAACAgQAAxUAAWCAdwtD3rfXoHZLp2tP1EPsWbF_AAJ8CQACQ5AIUAPiUsjsk-JtHwQ',
    { reply_to_message_id: message.message_id }
  )
}

/**
 * Risponde al messaggio con un messaggio testuale
 * @param {message} message
 * @param {string} textAnswer
 */
function replyWithMarkdown(message: Message.TextMessage, textAnswer: string) {
  bot.telegram.sendMessage(
    message.chat.id,
    textAnswer,
    { parse_mode: 'HTML' }
  )
}

function sendMessageToAdmin(text: string) {
  bot.telegram.sendMessage(ADMIN_ID, text)
}


exports.bot = bot