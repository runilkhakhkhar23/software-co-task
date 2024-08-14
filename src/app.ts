import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { connectDB, envConfigs } from "./configs";
import { createDefaultRole } from "./controllers";
import router from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  return res.status(500).send("Something broke!");
});

const PORT = envConfigs.server.port || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await createDefaultRole();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server start error:", err.message);
    process.exit(1);
  }
};

startServer();
