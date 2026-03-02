import { Router, type Request, type Response } from "express";
import { checkIdempotency } from "@/services/messages";
import { processMessage } from "@/services/chat";
import { getTasks } from "@/services/tasks";
import { db } from "@/db";
import { messages, taskComments, tasks } from "@/db/schema";

export const chatRouter: Router = Router();

chatRouter.post("/chat", async (request: Request, response: Response) => {
  const { message } = request.body;

  const cached = await checkIdempotency(message);
  if (cached) {
    response.json({ response: cached });
    return;
  }

  const result = await processMessage(message);
  result.pipeTextStreamToResponse(response);
});

chatRouter.get("/tasks", async (_request: Request, response: Response) => {
  const allTasks = await getTasks();
  response.json(allTasks);
});

chatRouter.post("/reset", async (_request: Request, response: Response) => {
  await db.delete(taskComments);
  await db.delete(messages);
  await db.delete(tasks);
  response.json({ status: "ok" });
});
