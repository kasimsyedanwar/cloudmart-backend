import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@cloudmart.com';
const ADMIN_PASSWORD = 'Password@123';

const seedAdmin = async (): Promise<void> => {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    },
    update: {
      name: 'CloudMart Admin',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'CloudMart Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Admin user seeded successfully.');
  console.log(`Admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
};

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
