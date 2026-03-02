import { z } from "zod";
import { tool } from "ai";
import {
  addCommentToTask,
  completeTask,
  createTask,
  getTasks,
} from "@/services/tasks";

export const getTasksTool = tool({
  description: "Get the current tasks with corresponding comments",
  inputSchema: z.object({}),
  execute: async () => {
    const tasks = await getTasks();

    return tasks;
  },
});

export const completeTaskTool = tool({
  description: "Update an existing task's status to completed",
  inputSchema: z.object({
    id: z.number().describe("The task's unique id"),
  }),
  execute: async ({ id }) => {
    const updatedTask = await completeTask(id);

    return updatedTask;
  },
});

export const createTaskTool = tool({
  description: "Create a new task. Provide a title and an optional description",
  inputSchema: z.object({
    title: z.string().describe("The name of the task"),
    description: z
      .string()
      .optional()
      .describe("Optional description for the task"),
    status: z
      .enum(["todo", "completed"])
      .optional()
      .describe("Optional status for task. Defaults to todo"),
  }),
  execute: async (input) => {
    const newTask = await createTask(input);

    return newTask;
  },
});

export const addCommentToTaskTool = tool({
  description: "Add a new comment, notes, or any form of text to task",
  inputSchema: z.object({
    taskId: z.number().describe("The task's unique id"),
    comment: z.string(),
  }),
  execute: async ({ taskId, comment }) => {
    const newComment = await addCommentToTask(taskId, comment);
    return newComment;
  },
});
