export interface SeedTopic {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  subtopics?: Omit<SeedTopic, "subtopics">[];
}

export const PREDEFINED_TOPICS: SeedTopic[] = [
  {
    name: "Data Structures & Algorithms",
    slug: "dsa",
    description: "Arrays, trees, graphs, DP, and problem-solving patterns.",
    icon: "binary",
    color: "oklch(0.65 0.2 25)",
  },
  {
    name: "System Design",
    slug: "system-design",
    description: "Designing scalable, reliable, distributed systems.",
    icon: "network",
    color: "oklch(0.65 0.2 145)",
    subtopics: [
      {
        name: "Distributed Systems",
        slug: "distributed-systems",
        description: "Consensus, replication, partitioning, CAP trade-offs.",
        icon: "share-2",
        color: "oklch(0.65 0.2 145)",
      },
    ],
  },
  {
    name: "Kubernetes",
    slug: "kubernetes",
    description: "Container orchestration, deployments, and cluster ops.",
    icon: "container",
    color: "oklch(0.65 0.2 260)",
  },
  {
    name: "Docker",
    slug: "docker",
    description: "Images, containers, and build workflows.",
    icon: "package",
    color: "oklch(0.7 0.15 230)",
  },
  {
    name: "Java",
    slug: "java",
    description: "Core language, JVM internals, and ecosystem.",
    icon: "coffee",
    color: "oklch(0.65 0.2 40)",
  },
  {
    name: "Spring Boot",
    slug: "spring-boot",
    description: "Building backend services on the Spring ecosystem.",
    icon: "leaf",
    color: "oklch(0.68 0.18 145)",
  },
  {
    name: "Angular",
    slug: "angular",
    description: "Components, RxJS, and frontend architecture.",
    icon: "layout-template",
    color: "oklch(0.6 0.22 15)",
  },
  {
    name: "JavaScript & TypeScript",
    slug: "javascript-typescript",
    description: "Language fundamentals, async patterns, and typing.",
    icon: "file-code",
    color: "oklch(0.75 0.18 90)",
  },
  {
    name: "Agentic AI",
    slug: "agentic-ai",
    description: "Autonomous agents, tool use, and orchestration.",
    icon: "bot",
    color: "oklch(0.6 0.2 300)",
  },
  {
    name: "LLMs & RAG",
    slug: "llms-rag",
    description: "Prompting, embeddings, retrieval, and grounding.",
    icon: "brain",
    color: "oklch(0.6 0.2 320)",
  },
];
