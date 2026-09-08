import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully");
  });

  const baseUri = (process.env.MONGO_URI || "").replace(/\/+$/, "");
  await mongoose.connect(`${baseUri}/bhu`, { family: 4 });
};

export { connectDB };


