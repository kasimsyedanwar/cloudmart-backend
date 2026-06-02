import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resetDatabase = async (): Promise<void> => {
  console.log('Resetting CloudMart database...');

  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.dashboardSnapshot.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('CloudMart database reset completed.');
};

resetDatabase()
  .catch((error) => {
    console.error('CloudMart database reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
