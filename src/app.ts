import "dotenv/config";

import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  EVENTS,
} from "@builderbot/bot";
import { MemoryDB as Database } from "@builderbot/bot";
import {
  BaileysProvider,
  BaileysProvider as Provider,
} from "@builderbot/provider-baileys";
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants";
import { typing } from "./utils/presence";
import { numberClean } from "./utils/utils";

const PORT = process.env?.PORT ?? 3008;
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? "";
const ADMIN_NUMBER = process.env?.ADMIN_NUMBER ?? "";


const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME).addAction(
  async (ctx, { flowDynamic, state, provider, blacklist }) => {
    // reviso si esta muteado
    const dataCheck = blacklist.checkIf(ctx.from);
    console.log(`Numero de donve viene el mensaje: ${ctx.from}`);
    if (dataCheck) {
      console.log(`muteado`);
    } else {
      console.log("no muteado");
      await typing(ctx, provider);
      const response = await toAsk(ASSISTANT_ID, ctx.body, state);
      const chunks = response.split(/\n\n+/);
      for (const chunk of chunks) {
        await flowDynamic([{ body: chunk.trim() }]);
      }
    }
  }
);

// const cancelar = addKeyword<BaileysProvider>([
//   "cancelar",
//   "humano",
//   "Claudio",
// ]).addAction(async (_, { state, endFlow }) => {
//   const botOffForThisUser = state.get<boolean>("botOffForThisUser");
//   await state.update({ botOffForThisUser: !botOffForThisUser });
//   if (botOffForThisUser) return endFlow();
//   console.log("se acabo el flow");
// });
// .addAnswer('Hola, Aida descansará por ahora, mi nombre es Claudio y te estaré atendiendo !')

// switch para detener la conversación con el numero. solo debo escribir Mute -34000000 (en numero del usuario)
const blackListFlow = addKeyword<Provider, Database>("mute")
  .addAction(async (ctx, { blacklist, flowDynamic }) => {
    // ctx.from= 5217551048550
    // console.log(ctx.body);
    // if (ctx.from === ADMIN_NUMBER) {
    // console.log(ctx.from);
    const toMute = numberClean(ctx.body); //Mute +34000000 message incoming
    const check = blacklist.checkIf(toMute);
    if (!check) {
      blacklist.add(toMute);
      await flowDynamic(`❌ ${toMute} muted`);
      return;
    }
    blacklist.remove(toMute);
    await flowDynamic(`🆗 ${toMute} unmuted`);
    return;
    // }
  })
  .addAnswer("res de blacklist");

const main = async () => {
  const adapterFlow = createFlow([welcomeFlow, blackListFlow,]);
  // const adapterFlow = createFlow([welcomeFlow, blackListFlow]);
  const adapterProvider = createProvider(Provider);
  const adapterDB = new Database();

  const { httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  httpInject(adapterProvider.server);
  httpServer(+PORT);
};

main();
