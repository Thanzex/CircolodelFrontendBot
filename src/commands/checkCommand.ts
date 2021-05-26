import { checkMessageWithLink, CommandHandlerParams } from '../common';

export function checkCommand(ctx: CommandHandlerParams) {
  if (ctx.chat.type == 'private')
    console.log(`Got /check from ${ctx.chat.username}`);

  try {
    const message = ctx.update.message;
    const { newLink, oldLink, err } = checkMessageWithLink(message)
    if (oldLink) {
      ctx.reply("🟡Cartellino Giallo!🟡\nLink già inviato.")
    } else if (newLink) {
      ctx.reply("Link non ancora inviato!")
    } else {
      ctx.reply("Se hai inviato un link, non sembra valido!")
    }

  } catch (e) {
    console.log(e);
  }
}
