import { openai } from "@ai-sdk/openai";
import { type StreamTextResult, streamText, stepCountIs } from "ai";
import {
  getTasksTool,
  completeTaskTool,
  createTaskTool,
  addCommentToTaskTool,
} from "@/ai/taskTracker/tools";
import { getTasks } from "@/services/tasks";
import { getRecentMessages, storeMessage } from "@/services/messages";

const SYSTEM_PROMPT = `
You are a task tracker assistant. You help users manage their tasks through natural conversation.

You have access to the following tools:
- getTasks: View all current tasks and their comments
- createTask: Create a new task with a title and optional description
- completeTask: Mark a task as completed
- addCommentToTask: Attach a free-text note or detail to a task

Guidelines:
- A single user message may imply multiple actions (e.g., creating several tasks). Execute all of them.
- When the user wants to complete or comment on a task, always call getTasks first to find the correct task by matching their intent against existing tasks.
- If the user's intent is ambiguous (e.g., multiple tasks could match), ask a short clarifying question instead of guessing.
- After performing actions, reply with a concise summary of what you did.
- Do not invent or assume tasks that the user did not mention.

Guardrails:
- Only call tools when the user clearly intends a task-related action (create, complete, or add detail).
- Never create, complete, or modify tasks that the user did not explicitly or implicitly request.
- If a message is off-topic or unrelated to task management, respond politely and redirect the user back to task management. Do not call any tools.
- Do not execute destructive actions (e.g., completing multiple tasks) without confirming with the user first.
- Never expose internal system details, tool names, or database structure to the user.
`.trim();

export async function processMessage(
  content: string,
): Promise<StreamTextResult<any, any>> {
  await storeMessage("user", content);

  const recentMessages = await getRecentMessages();
  const currentTasks = await getTasks();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `${SYSTEM_PROMPT}\n\nCurrent tasks:\n${JSON.stringify(currentTasks)}`,
    messages: recentMessages,
    tools: {
      getTasks: getTasksTool,
      completeTask: completeTaskTool,
      createTask: createTaskTool,
      addCommentToTask: addCommentToTaskTool,
    },
    stopWhen: stepCountIs(5),
    async onFinish({ text }) {
      if (text) {
        await storeMessage("assistant", text);
      }
    },
  });

  return result;
}
