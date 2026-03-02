import express from "express";
import cors from "cors";
import "dotenv/config";
import { env } from "./config/env";
import { chatRouter } from "./routers/chat";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health_check", (req, res) => {
  res.json({ status: "ok" });
});

app.use(chatRouter);

app.listen(env.PORT, () => {
  console.log(`Server listening at ${env.PORT}`);
});
