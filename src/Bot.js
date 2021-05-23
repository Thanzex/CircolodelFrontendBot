const { Telegraf, } = require('telegraf')
const { DB, addNewLink } = require('./Db')
const { OMG } = require("./OMG")
const { lol, rebuildFromHistory } = require('./rebuildFromHistory')
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN || "")
const Omg = new OMG()

const veryFunnyMessagesAboutFlutter = [
  "🚨<a href='https://i.imgur.com/Sml2Ayv.png'>&#8205;</a>",
  "🚨<a href='https://i.imgur.com/m0gb4Qa.png'>&#8205;</a>",
  "🚨<a href='https://i.imgur.com/SnSjGMa.png'>&#8205;</a>",
  "🚨<a href='https://i.imgur.com/GsdpgXF.png'>&#8205;</a>",
  "🚨<a href='https://i.imgur.com/ilfzQUW.png'>&#8205;</a>",
  "🚨<a href='https://i.imgur.com/mlwDtRi.png'>&#8205;</a>",
  "Finally we know: HTML and regex<a href='https://i.imgur.com/10nBaqX.png'>&#8205;</a>",
  "<i>beep boop</i> flutter è una 💩<a href='https://www.reddit.com/r/mAndroidDev/comments/kp6ks7/now_tell_me_which_one_of_you_did_this/?utm_source=share&utm_medium=web2x&context=3)'>.</a>",
  "<i><a href='https://medium.com/@acedened/ios-app-from-flutters-showcase-page-might-not-use-flutter-at-all-23488ff82407'>Flutter is so great that mostly native app is showcased on Flutter page</a>"
]

console.log("Starting.")
sendMessageToAdmin("Sono stato riavviato.")

bot.command('/start', (ctx) => {
  console.log(`Got /start from ${ctx.chat.username} in chat ${ctx.chat.id}`)
  ctx.reply("Ciao! Sono un bot molto specifico che risponde solo a certi messaggi di Simone in CircoloDelFrontend.\nPurtroppo non ti posso essere di altro aiuto!")
})

bot.command('/test', (ctx) => {
  console.log(`Got /test from ${ctx.chat.username}`)
  const message = ctx.update.message
  replyWithSticker(message)
})

bot.command("/links", (ctx) => {
  console.log(`Got /links from ${ctx.chat.username}`)
  printDB(ctx)
}) 

bot.command('/rebuild', (ctx) => {
  console.log(`Got /rebuild from ${ctx.chat.username}`)
  DB.push('/admin/DB', {
    rebuilding: {
      inProgress: true,
      chatId: ctx.chat.id
    }
  })
})

bot.command("/check", (ctx) => {
  console.log(`Got /check from ${ctx.chat.username}`)
  const message = ctx.update.message
  checkLink(message, false)
})

bot.on("message", (ctx) => {
  console.log(`Got /message from ${ctx.chat.username} in chat ${ctx.chat.id}`)
  const message = ctx.update.message
  handleMessage(message)
})

/**
 * Controlla se il gruppo è quello giusto tramite ID della chat,
 * che il messaggio sia di Simone e che contenga un link.
 * In tal caso chiama OMG per rispondere al messaggio.
 *
 * @param @param {import('telegraf/typings/core/types/typegram').Message} message
 */
function handleMessage(message) {
  /**
   * Gruppo
   * -  Link
   *    - flutter praises
   *    - Link di Simone
   *    - Link normale
   * Privato
   * -  DB Rebuild
   */
  if (message.chat.id === -1001483484509) {
    if (message.text.includes("flutter")) {
      replyWithMarkdown(message, veryFunnyMessagesAboutFlutter[randomNumber(0, veryFunnyMessagesAboutFlutter.length)])
    }
    else if (message.entities && message.entities[0].type == 'url') {
      if (message.from.username == "pow_ext") {
        console.log("Got link from Simone")
        Omg.omg(replyWithSticker)(message)
        checkLink(message)
      } else {
        console.log("Got link from group")
        checkLink(message)
      }
    }
  } else {
    handlePrivateMessage(message)
    if (DB.getData('/admin/DB/rebuilding/inProgress'))
      DB.push('/admin/DB/rebuilding/inProgress', false)
  }
}

/**
 * Controlla se un link è già stato inviato
 * @param {import('telegraf/typings/core/types/typegram').Message} message 
 */
function checkLink(message, fromGroup = true) {
  const newLink = extractLinkFromMessage(message)
  const { host, pathname } = new URL(newLink)
  const links = DB.getData("/links")

  const existingLink = links.find(l => (l.host == host && l.path == pathname));
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

function extractLinkFromMessage(message) {
  const urlEntity = message.entities.find((e) => e.type == 'url')
  const start = urlEntity.offset
  const stop = start + urlEntity.length
  return message.text.slice(start, stop)
}

/**
 * Step da eseguire quando si riceve un nuovo link nel gruppo.
 * Aggiunge un link al db e invia un backup del db a Thanzex
 * @param {string} link 
 */
function newLinkFromGroup(link) {
  addNewLink(link)
  // sendMessageToAdmin("Nuovo link!\nBackup:")
  // sendMessageToAdmin(printDB())
}


function printDB(ctx) {
  const links = DB.getData("/links").map(obj => obj.complete)
  const messages = [""]
  let length = 0
  for (link of links) {
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
function handlePrivateMessage(message) {
  const rebuilding = DB.getData('/admin/DB/rebuilding')
  if (rebuilding.inProgress && rebuilding.chatId == message.chat.id) {
    rebuildDatabase(message)
  }
}

/**
 * Ricostruisce il DB a partire da un messaggio con una lista di link
 * @param {message} message 
 */
async function rebuildDatabase(message) {
  console.log("Rebuilding database.")
  if (!message.document) {
    console.log("Invalid message.")
    return
  }
  DB.push("/links", [])
  console.log(message)
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
function replyWithSticker(message) {
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
function replyWithMarkdown(message, textAnswer) {
  bot.telegram.sendMessage(
    message.chat.id,
    textAnswer,
    { parse_mode: 'HTML' }
  )
}

function sendMessageToAdmin(text) {
  bot.telegram.sendMessage(644826120, text)
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

exports.bot = bot