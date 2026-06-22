import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const planes = [
    {
      nombre: 'Básico',
      descripcion: 'Plan básico con límite de 20 productos y 1 imagen por producto.',
      nivel: 1,
      limiteProductos: 20,
      limiteImagenesPorProducto: 1,
    },
    {
      nombre: 'Avanzado',
      descripcion: 'Plan avanzado con límite de 40 productos y 1 imagen por producto.',
      nivel: 2,
      limiteProductos: 40,
      limiteImagenesPorProducto: 1,
    },
    {
      nombre: 'Profesional',
      descripcion: 'Plan profesional con límite de 80 productos y 4 imágenes por producto.',
      nivel: 3,
      limiteProductos: 80,
      limiteImagenesPorProducto: 4,
    },
  ];

  for (const plan of planes) {
    await prisma.plan.upsert({
      where: { nombre: plan.nombre },
      update: {
        descripcion: plan.descripcion,
        nivel: plan.nivel,
        limiteProductos: plan.limiteProductos,
        limiteImagenesPorProducto: plan.limiteImagenesPorProducto,
      },
      create: plan,
    });
  }

  console.log('Planes creados/actualizados exitosamente.');

  // Crear usuario admin
  const adminEmail = 'admin@ratelapps.com';
  const adminPassword = 'Xndre$99';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      rol: 'ADMIN',
      nombre: 'Admin',
      apellido: 'Ratel',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      nombre: 'Admin',
      apellido: 'Ratel',
      rol: 'ADMIN',
    },
  });

  console.log(`Usuario admin creado/actualizado exitosamente: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
