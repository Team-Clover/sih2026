import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully");
  });

  await mongoose.connect(`${process.env.MONGO_URI}/bhu`, { family: 4 });
};

export { connectDB };


