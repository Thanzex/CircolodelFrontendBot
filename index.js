const { Telegraf, } = require('telegraf')
const { OMG } = require("./OMG")

const bot = new Telegraf(process.env.BOT_TOKEN || "")
const Omg = new OMG()

console.log("Starting.")

bot.command('/start', (ctx) => {
  ctx.reply("Ciao! Sono un bot molto specifico che risponde solo a certi messaggi di Simone in CircoloDelFrontend.\nPurtroppo non ti posso essere di altro aiuto!")
})

bot.command('/test', (ctx) => {
  const message = ctx.update.message
  replyWithSticker(message)
})

bot.on("message", (ctx) => {
  const message = ctx.update.message
  handleMessage(message)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

/**
 * Controlla se il gruppo è quello giusto tramite ID della chat,
 * che il messaggio sia di Simone e che contenga un link.
 * In tal caso chiama OMG per rispondere al messaggio. 
 * 
 * @param {message} message 
 */
function handleMessage(message) {
  if (message.chat.id == -1001483484509 &&
    message.from.username == "pow_ext" &&
    message.entities &&
    message.entities[0].type == 'url') {
    Omg.omg(replyWithSticker)(message)
  }
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

