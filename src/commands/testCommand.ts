import { CommandHandlerParams, replyWithSticker } from "../common"

export function testCommand(ctx: CommandHandlerParams): void {
  if (ctx.chat.type == "private")
    console.log(`Got /test from ${ctx.chat.username}`)

  replyWithSticker(
    ctx,
    "CAACAgQAAxUAAWCAdwtD3rfXoHZLp2tP1EPsWbF_AAJ8CQACQ5AIUAPiUsjsk-JtHwQ"
  )
}
