import { CommandHandlerParams, replyWithSticker } from "../common";

export function testCommand(ctx: CommandHandlerParams) {
  if (ctx.chat.type == 'private')
    console.log(`Got /test from ${ctx.chat.username}`);

  const message = ctx.update.message;
  replyWithSticker(ctx, 'CAACAgQAAxUAAWCAdwtD3rfXoHZLp2tP1EPsWbF_AAJ8CQACQ5AIUAPiUsjsk-JtHwQ');
}
