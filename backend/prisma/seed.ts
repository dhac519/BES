import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@bes.com'; // Puedes cambiar esto
  const adminPassword = 'admin_password_2026'; // ¡Cambia esto después de entrar!

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.usuario.create({
      data: {
        email: adminEmail,
        nombre: 'Super Admin BES',
        password: hashedPassword,
        rol: Role.SUPER_ADMIN,
      },
    });
    console.log('✅ Super Admin creado con éxito');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } else {
    console.log('⚠️ El Super Admin ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
