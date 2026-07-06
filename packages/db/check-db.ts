import { prisma } from "./src/index";

async function main() {
  const keys = await prisma.apiKey.findMany();
  console.log("--- API Keys in DB ---");
  console.log(keys);

  const projects = await prisma.project.findMany();
  console.log("--- Projects in DB ---");
  console.log(projects);

  const monitors = await prisma.monitor.findMany();
  console.log("--- Monitors in DB ---");
  console.log(monitors);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
