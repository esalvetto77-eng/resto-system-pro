import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const test = await prisma.test.create({
    data: {
      name: "Funciona Prisma 🎉",
    },
  });

  console.log(test);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
