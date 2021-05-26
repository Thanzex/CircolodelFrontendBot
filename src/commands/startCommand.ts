import { CommandHandlerParams } from '../common';

export function startCommand(ctx: CommandHandlerParams) {
  if (ctx.chat.type != 'private') {
    return;
  }
  console.log(`Got /start from ${ctx.chat.username} in chat ${ctx.chat.id}`);
  ctx.reply("Ciao! Sono un bot molto specifico che risponde solo a certi messaggi di Simone in CircoloDelFrontend.\nPurtroppo non ti posso essere di altro aiuto!");
}
