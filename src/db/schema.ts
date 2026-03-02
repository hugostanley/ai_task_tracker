import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  taskId: t
    .integer("task_id")
    .references(() => tasks.id)
    .notNull(),
  description: t.text("description").notNull(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
}));
