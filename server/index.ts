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

const wss = new WebSocketServer({ 
  server: server
});

wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString());

    if (message.type === "ping") {
      socket.send(JSON.stringify({
        type: "pong",
        sentAt: message.sentAt,
      }));
    }
  });

  socket.on("close", () => console.log("Client disconnected"));
})

server.listen({port:6767}, () => {
  console.log("the server is at http://localhost:6767");
})