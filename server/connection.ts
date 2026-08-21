export function handleNewConnection() {
  let id = count++;
  players.set(socket, { id, x: 0, y: 0 });
  socket.on("message", handle);

  socket.on("close", () => {
    console.log("Client disconnected");
    players.delete(socket);
  });

}