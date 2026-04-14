import TcpSocket from "react-native-tcp-socket";

type SocketType = any;

let server: SocketType | null = null;
let clients: SocketType[] = [];
let seenMessages = new Set<string>();

// 📡 Start server (every device runs this)
export const startServer = (onMessage: (msg: string) => void) => {
  if (server) {
    console.log("⚠️ Server already running");
    return;
  }

  server = TcpSocket.createServer((socket: SocketType) => {
    console.log("🟢 Incoming connection from:", socket.address());

    clients.push(socket);

    socket.on("data", (data: string | Buffer) => {
      const msgStr = typeof data === "string" ? data : data.toString();

      try {
        const msg = JSON.parse(msgStr);

        if (seenMessages.has(msg.id)) {
          console.log("♻️ Duplicate ignored:", msg.id);
          return;
        }

        seenMessages.add(msg.id);

        console.log("📥 Received:", msg.text, "| ID:", msg.id);

        onMessage(msg.text);

        // 🔁 Relay to other clients
        clients.forEach((c) => {
          if (c !== socket) {
            c.write(JSON.stringify(msg));
          }
        });

        console.log("🔁 Relayed message:", msg.id);
      } catch (err) {
        console.log("❌ Parse error:", err);
      }
    });

    socket.on("close", () => {
      console.log("🔴 Client disconnected");
      clients = clients.filter((c) => c !== socket);
    });

    socket.on("error", (err: any) => {
      console.log("❌ Socket error:", err);
    });
  });

  server.listen({ port: 8080, host: "0.0.0.0" }, () => {
    console.log("🚀 Server started on port 8080");
  });
};

// 🔗 Connect to another device
export const connectToServer = (ip: string) => {
  console.log("🔗 Attempting connection to:", ip);

  const socket = TcpSocket.createConnection({ port: 8080, host: ip }, () => {
    console.log("✅ Connected to:", ip);
    clients.push(socket);
  });

  socket.on("data", (data: string | Buffer) => {
    const msgStr = typeof data === "string" ? data : data.toString();

    try {
      const msg = JSON.parse(msgStr);

      if (seenMessages.has(msg.id)) {
        console.log("♻️ Duplicate ignored:", msg.id);
        return;
      }

      seenMessages.add(msg.id);

      console.log("📥 Received (client):", msg.text);

      // 🔁 Relay
      clients.forEach((c) => {
        if (c !== socket) {
          c.write(JSON.stringify(msg));
        }
      });

      console.log("🔁 Relayed from client:", msg.id);
    } catch (err) {
      console.log("❌ Parse error:", err);
    }
  });

  socket.on("close", () => {
    console.log("🔴 Disconnected from:", ip);
    clients = clients.filter((c) => c !== socket);
  });

  socket.on("error", (err: any) => {
    console.log("❌ Client error:", err);
  });
};

// 📤 Broadcast message to all connected devices
export const broadcastMessage = (text: string) => {
  const message = {
    id: Date.now().toString(),
    text,
  };

  seenMessages.add(message.id);

  console.log("📤 Broadcasting:", message.text, "| ID:", message.id);

  clients.forEach((c) => {
    c.write(JSON.stringify(message));
  });
};

export const tryConnectToPeers = () => {
  const baseIPs = [
    "192.168.43.1", // hotspot host
    "192.168.1.1", // router (dev mode)
  ];

  console.log("🔍 Trying known peer IPs...");

  baseIPs.forEach((ip) => {
    connectToServer(ip);
  });
};
