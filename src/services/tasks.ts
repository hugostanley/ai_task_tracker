import { taskComments, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export async function getTasks() {
  const currentTasks = await db.query.tasks.findMany({
    with: {
      comments: true,
    },
  });

  return currentTasks;
}

export async function completeTask(taskId: number) {
  const updatedTask = await db
    .update(tasks)
    .set({
      status: "completed",
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return updatedTask[0];
}

export async function createTask(data: {
  title: string;
  description?: string | undefined;
  status?: "todo" | "completed" | undefined;
}) {
  const newTask = await db.insert(tasks).values({
    title: data.title,
    description: data.description,
    status: data.status,
  });

  return newTask;
}

export async function addCommentToTask(taskId: number, comment: string) {
  const newComment = await db.insert(taskComments).values({
    description: comment,
    taskId,
  });

  return newComment;
}
