import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.enrollment.deleteMany();
    await tx.userProfile.deleteMany();
    await tx.student.deleteMany();
    await tx.user.deleteMany();
    await tx.course.deleteMany();

    const course1 = await tx.course.create({
      data: {
        title: 'Fundamental NestJS untuk Pemula',
        description:
          'Kelas pengantar untuk memahami dasar NestJS dan REST API.',
        lessons: {
          create: [
            {
              title: 'Pengenalan NestJS & arsitektur modul',
              sortOrder: 1,
            },
            {
              title: 'Controller, route, dan HTTP method',
              sortOrder: 2,
            },
          ],
        },
      },
    });

    const course2 = await tx.course.create({
      data: {
        title: 'TypeScript Lanjutan untuk Backend',
        description:
          'Membahas tipe lanjutan dan praktik terbaik TypeScript di server.',
        lessons: {
          create: [
            {
              title: 'Generics & utility types',
              sortOrder: 1,
            },
          ],
        },
      },
    });

    const course3 = await tx.course.create({
      data: {
        title: 'Integrasi Database dengan Prisma',
        description: 'Latihan integrasi ORM Prisma ke project NestJS.',
        lessons: {
          create: [
            {
              title: 'Relasi one-to-many & nested queries',
              sortOrder: 1,
            },
          ],
        },
      },
    });

    await tx.user.create({
      data: {
        email: 'mentor@learning.local',
        profile: {
          create: {
            fullName: 'Mentor Prisma',
            bio: 'Contoh relasi one-to-one antara User dan UserProfile.',
          },
        },
      },
    });

    const student1 = await tx.student.create({
      data: {
        email: 'andi@student.local',
        name: 'Andi',
      },
    });

    const student2 = await tx.student.create({
      data: {
        email: 'bela@student.local',
        name: 'Bela',
      },
    });

    await tx.enrollment.createMany({
      data: [
        { studentId: student1.id, courseId: course1.id },
        { studentId: student1.id, courseId: course3.id },
        { studentId: student2.id, courseId: course2.id },
      ],
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Prisma seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
