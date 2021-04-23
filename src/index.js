const { bot } = require('./Bot.js')
const { DB } = require('./Db.js')

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))