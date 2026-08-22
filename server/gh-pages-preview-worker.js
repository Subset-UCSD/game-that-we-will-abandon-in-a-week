/**
 * fake websocket server for GitHub Pages preview
 */

import { Game } from "@server/game";
import { clientMessage } from "@common/messages";
import {SERVER_GAME_TICK} from '@common/index'

const game = new Game();

const ws = {
  send: message => self.postMessage(message)
}

self.addEventListener('message', e => {
  game.handleMessage(ws, clientMessage.parse(JSON.parse(e.data)));
})


while (true) {

  game.loop()

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}
