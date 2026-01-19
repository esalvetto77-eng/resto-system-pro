import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Limpieza opcional (solo para dev)
  await prisma.usuario.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.createMany({
    data: [
      {
        nombre: "Dueño",
        email: "dueno@resto.com",
        password: passwordHash,
        rol: "DUENO",
        activo: true,
      },
      {
        nombre: "Encargado",
        email: "encargado@resto.com",
        password: passwordHash,
        rol: "ENCARGADO",
        activo: true,
      },
    ],
  });

  console.log("✅ Usuarios creados correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
