const { Telegraf, } = require('telegraf')
const { DB } = require('./Db')
const { OMG } = require("./OMG")

const bot = new Telegraf(process.env.BOT_TOKEN || "")
const Omg = new OMG()

console.log("Starting.")
sendMessageToAdmin("Sono stato riavviato.")

bot.command('/start', (ctx) => {
  ctx.reply("Ciao! Sono un bot molto specifico che risponde solo a certi messaggi di Simone in CircoloDelFrontend.\nPurtroppo non ti posso essere di altro aiuto!")
})

bot.command('/test', (ctx) => {
  const message = ctx.update.message
  replyWithSticker(message)
})

bot.command("/showdb",(ctx) => {
  ctx.reply(printDB())
}) 

bot.command('/rebuild', (ctx) => {
  DB.push('/admin/DB', {
    rebuilding: {
      inProgress: true,
      chatId: ctx.chat.id
    }
  })
})

bot.command("/check", (ctx) => {
  const message = ctx.update.message
  checkLink(message, false)
})

bot.on("message", (ctx) => {
  const message = ctx.update.message
  handleMessage(message)
})

/**
 * Controlla se il gruppo è quello giusto tramite ID della chat,
 * che il messaggio sia di Simone e che contenga un link.
 * In tal caso chiama OMG per rispondere al messaggio. 
 * 
 * @param {message} message 
 */
function handleMessage(message) {
  /**
   * Gruppo
   * -  Link
   *    - Link di Simone
   *    - Link normale
   * Privato
   * -  DB Rebuild
   */
  if (message.chat.id == -1001483484509) {
    if (message.entities && message.entities[0].type == 'url') {
      if (message.from.username == "pow_ext") {
        Omg.omg(replyWithSticker)(message)
        checkLink(message)
      } else {
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

  if (links.find(l => (l.host == host && l.path == pathname))) {
    bot.telegram.sendMessage(message.chat.id, "🟡Cartellino Giallo!🟡\nLink già inviato.")
  } else if (fromGroup) {
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
  sendMessageToAdmin("Nuovo link!\nBackup:")
  sendMessageToAdmin(printDB())
}


function printDB() {
  return DB.getData("/links").map(obj => obj.complete).join("\n")
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
function rebuildDatabase(message) {
  bot.telegram.sendMessage(message.chat.id, "Backup:")
  bot.telegram.sendMessage(message.chat.id, printDB())
  DB.push("/links", [])
  const links = message.text.split('\n')
  const invalidLinks = []
  links.forEach(link => {
    try {
      addNewLink(link)
    } catch (e) {
      invalidLinks.push(link)
    }
  })
  bot.telegram.sendMessage(message.chat.id,
    `Ho inserito ${links.length - invalidLinks.length}/${links.length} link \n\
    ${invalidLinks.length ? 'Link non validi:\n\
    ${invalidLinks.join("\n")': ''}`
  )
}

/**
 * Aggiunge un link al DB da una stringa
 * 
 * @param {string} link 
 */
function addNewLink(link) {
  const url = new URL(link)
  const newEntry = {
    host: url.host,
    path: url.pathname,
    complete: url.href
  }
  DB.push("/links[]", newEntry)
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

function sendMessageToAdmin(text) {
  bot.telegram.sendMessage(644826120, text)
}

exports.bot = bot