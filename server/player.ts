import { Connection } from "@server/net/connection";

export class Player {
  private connection?: Connection;

  constructor() {
    
  }

  connect(connection: Connection) {
    this.connection = connection;
    console.log(connection)
  }

  
}