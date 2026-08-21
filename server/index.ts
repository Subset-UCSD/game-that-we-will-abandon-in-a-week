import {createServer} from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";

import { handle, handle as handleNewConnection } from "@server/messenger";

const server = createServer();
const app = express();

app.use(express.static('public'));
server.on("request", app);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

let count = 0;

const wss = new WebSocketServer({ 
    server: server
});

// map player id to player info (location so far)
type Player = {
  id: string;
  x: number;
  y: number;
};
const players = new Map<WebSocket, Player>();

function broadcast(data: unknown) {
  const message = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on("connection", (socket) => handleNewConnection)

// socket send location info every frame (1/60th of a second)
setInterval(() => {
  broadcast({
    type: "players",
    players: [...players.values()],
  });
}, 1000/60); // 1000 ms over 60 times

server.listen({port:6767}, () => {
  console.log("the server is at http://localhost:6767");
})