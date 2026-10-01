import type { Post, Topic } from "./types.ts";

export const site = {
  name: "ai-es",
  origin: "https://ai-es.dev",
  description:
    "Comunidad en español para hablar de IA, software y videojuegos. Gente de España y Latinoamérica compartiendo proyectos, pruebas y dudas.",
  discord: "https://discord.gg/U9F4b9avV5",
  reddit: "https://www.reddit.com/r/ai_es/",
  github: "https://github.com/jvidalv/ai-es",
};

export const topics: Record<Topic, { name: string; description: string; icon: Post["icon"] }> = {
  ia: {
    name: "Inteligencia artificial",
    description: "Herramientas, pruebas y cosas que estamos aprendiendo.",
    icon: "03",
  },
  desarrollo: {
    name: "Desarrollo de software",
    description: "Aplicaciones, webs y código que nos hace la vida más fácil.",
    icon: "08",
  },
  videojuegos: {
    name: "Desarrollo de videojuegos",
    description: "Prototipos, motores y juegos a medio hacer.",
    icon: "05",
  },
};

export function postPath(post: Pick<Post, "slug">) {
  return `/blog/${post.slug}/`;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function dateLabel(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

export const routes = {
  home: {
    path: "/",
    label: "Inicio",
    title: "ai-es · IA, software y videojuegos en español",
    description: site.description,
  },
  blog: {
    path: "/blog/",
    label: "Blog",
    title: "Blog de IA y desarrollo en español · ai-es",
    description:
      "Apuntes, guías y novedades de IA, software y videojuegos. Lo que vamos probando, compartido en español.",
  },
  community: {
    path: "/comunidad/",
    label: "Comunidad",
    title: "Comunidad de IA y desarrollo de España y Latinoamérica · ai-es",
    description:
      "Gente de España y Latinoamérica hablando de IA, código y videojuegos. Nos encontramos en Discord y Reddit.",
  },
};
export function topicPath(topic: string) {
  return `/temas/${topic}/`;
}
export function isTopic(value: string | undefined): value is Topic {
  return value !== undefined && Object.hasOwn(topics, value);
}
