import { pgTable, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const taskStatusEnum = pgEnum("status", ["todo", "completed"]);
const messageRolesEnum = pgEnum("roles", ["user", "assistant"]);

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

export const messages = pgTable(
  "messages",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    role: messageRolesEnum().notNull(),
    content: t.text("content").notNull(),
    contentHash: t.varchar("content_hash", { length: 64 }),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
  }),
  (t) => [unique().on(t.contentHash)],
);

export const tasksRelations = relations(tasks, ({ many }) => ({
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
}));
