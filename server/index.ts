import {createServer} from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";

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

wss.on("connection", (socket) => {
  let id = count++;
  players.set(socket, { id, x: 0, y: 0 });
  socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString());

    if (message.type === "ping") {
      socket.send(JSON.stringify({
        type: "pong",
        sentAt: message.sentAt,
      }));
    } else if (message.type == "player") {
        // store player info in a map or smth
        // considering how to handle stale player (user refresh the page)

    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    players.delete(socket);
  });

  // socket send location info every frame (1/60th of a second)
})

server.listen({port:6767}, () => {
  console.log("the server is at http://localhost:6767");
})