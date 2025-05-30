import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.rol.createMany({
    data: [
      { rol_name: 'USER' },
      { rol_name: 'MIPYME' }
    ],
    skipDuplicates: true
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
