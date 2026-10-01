import { z } from "zod";

export const topicSchema = z.enum(["ia", "desarrollo", "videojuegos"]);
export const postMetadata = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(220),
  date: z.iso.date(),
  kind: z.enum(["articulo", "noticia"]),
  topic: topicSchema,
  author: z.string().min(1).default("ai-es"),
  icon: z.enum(["03", "04", "05", "06", "07", "08"]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});
