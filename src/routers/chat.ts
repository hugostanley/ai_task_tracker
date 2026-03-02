import { taskTrackerAgent } from "@/ai/agents/taskTracker";
import { pipeAgentUIStreamToResponse } from "ai";
import { Router, type Request, type Response } from "express";

export const chatRouter: Router = Router();

chatRouter.post("/chat", async (request: Request, response: Response) => {
  pipeAgentUIStreamToResponse({
    agent: taskTrackerAgent,
    uiMessages: request.body.messages,
    response,
  });
});
