import { io, Socket } from "socket.io-client";

type CheckSocketData = {
  portal: string;
  [key: string]: any;
};

class Sockets {
  public socketModule: Socket | null = null;

  async connect(): Promise<Socket> {
    const url =
      import.meta.env.VITE_ENVIRONMENT === "development"
        ? import.meta.env.VITE_SOCKET_API
        : import.meta.env.VITE_SOCKET_API_LIVE;

    this.socketModule = io(url as string);

    return this.socketModule;
  }

  async disconnect(): Promise<void> {
    if (this.socketModule) {
      if (this.socketModule.connected) {
        this.socketModule.disconnect();
      }
      console.log("Socket disconnected");
    }
  }

  socketConnect(): void {
    if (this.socketModule && !this.socketModule.connected) {
      this.socketModule.connect();
    }
  }

  checkSocket(data: CheckSocketData): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socketModule) {
        return resolve(false);
      }

      this.socketModule.emit(
        "in",
        data.portal,
        (isInGroup: boolean) => {
          console.log(data);
          console.log(isInGroup);
          resolve(isInGroup);
        }
      );
    });
  }
}

const SOCKETS = new Sockets();
export default SOCKETS;