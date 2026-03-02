import { pgTable, pgEnum } from "drizzle-orm/pg-core";

const taskStatusEnum = pgEnum("status", ["todo", "completed"]);

export const tasks = pgTable("tasks", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  title: t.text("title").notNull(),
  description: t.text("description"),
  status: taskStatusEnum().default("todo"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}));

export const taskComments = pgTable("task_comments", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: t.integer("task_id").references(() => tasks.id),
  description: t.text("description"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}));
