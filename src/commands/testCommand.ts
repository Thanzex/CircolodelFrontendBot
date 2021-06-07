import { CommandHandlerParams, replyWithSticker } from "../common"
import { stickers } from "../constants"

export function testCommand(ctx: CommandHandlerParams): void {
  if (ctx.chat.type == "private")
    console.log(`Got /test from ${ctx.chat.username}`)

  replyWithSticker(ctx, stickers.thankYouLord)
}
