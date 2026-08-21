// server/index.ts
import { WebSocketServer } from "ws";
var wss = new WebSocketServer({ port: 8081 });
wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.type === "ping") {
      socket.send(JSON.stringify({
        type: "pong",
        sentAt: message.sentAt
      }));
    }
  });
  socket.on("close", () => console.log("Client disconnected"));
});
console.log("WebSocket server running at ws://localhost:8081");
//# sourceMappingURL=server.js.map
