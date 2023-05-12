import { createServer } from "http";
import { Server } from "socket.io";
const httpServer = createServer();
import mongoose from "mongoose";
import Document from "./model/Document.js";
async function connectToMongoDB() {
  try {
    await mongoose
      .connect("mongodb://127.0.0.1:27017/test")
      .then(() => console.log("Connected!"));
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
const io = new Server(httpServer, {
  // options
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

async function findOrCreate(id) {
  if (!id) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: "" });
}

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreate(documentId);
    socket.join(documentId);
    socket.emit("load-document",  document.data);
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
  });
});

httpServer.listen(3000, async () => {
  connectToMongoDB();
  console.log("Server is running on port 3000");
});
