import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;
  private connectPromise: Promise<Socket> | null = null;
  private connectedListeners = new Set<(socket: Socket) => void>();

  private notifyConnected(socket: Socket) {
    this.connectedListeners.forEach((listener) => listener(socket));
  }

  public onConnected(listener: (socket: Socket) => void) {
    this.connectedListeners.add(listener);
    if (this.socket?.connected) listener(this.socket);
    return () => {
      this.connectedListeners.delete(listener);
    };
  }

  public connect(url: string): Promise<Socket> {
    if (this.socket?.connected) return Promise.resolve(this.socket);
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((rs, rj) => {
      this.socket = io(url, {
        transports: ["polling"],
        upgrade: false,
        path: "/socket.io",
      });

      if (!this.socket) {
        this.connectPromise = null;
        return rj(new Error("socket init failed"));
      }

      this.socket.on("disconnect", (reason) => {
        console.warn("[socket-client] disconnect", { reason });
      });
      this.socket.on("error", (error) => {
        console.error("[socket-client] error", error);
      });

      this.socket.once("connect", () => {
        this.notifyConnected(this.socket!);
        rs(this.socket!);
      });

      this.socket.once("connect_error", (err) => {
        console.error("[socket-client] connect:error", err?.message);
        this.connectPromise = null;
        rj(err);
      });
    });

    return this.connectPromise;
  }
}

const socketService = new SocketService();
export default socketService;
