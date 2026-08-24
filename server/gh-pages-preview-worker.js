/**
 * fake websocket server for GitHub Pages preview
 */

import { Game } from "@server/game";
import { clientMessage } from "@common/messages";
import {SERVER_GAME_TICK} from '@common'
import tiles from '../tiles.txt'
import { deserializeTiles } from "./tile-manager";

const game = new Game(deserializeTiles(tiles), async () => {});

const ws = {
  send: message => self.postMessage(message)
}

self.addEventListener('message', e => {
  game.handleMessage(ws, clientMessage.parse(JSON.parse(e.data)));
})


while (true) {

  game.loop()
  game.broadcastState()

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}
