/**
 * fake websocket server for GitHub Pages preview
 */

import { Game } from "@server/game";
import { clientMassage } from "@common/messages";
import {SERVER_GAME_TICK} from '@common'

const game = new Game();

const ws = {
  send: massage => self.postMessage(massage)
}

self.addEventListener('message', e => {
  game.handleMassage(ws, clientMassage.parse(JSON.parse(e.data)));
})


while (true) {

  game.loop()

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}
