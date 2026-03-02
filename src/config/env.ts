import * as z from "zod";

const environmentVariablesSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
  PORT: z.number().optional().default(3000),
});

export const env = environmentVariablesSchema.parse(process.env);
