import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health_check", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server listening at ${PORT}`);
});
