import express from "express";
import "dotenv/config";
import { env } from "./config/env";

const app = express();

app.use(express.json());

app.get("/health_check", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(env.PORT, () => {
  console.log(`Server listening at ${env.PORT}`);
});
