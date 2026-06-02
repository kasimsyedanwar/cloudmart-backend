import {
  InventoryMovementType,
  Prisma,
  PrismaClient,
  ProductStatus,
  UserRole,
  UserStatus,
  VendorStatus,
} from '@prisma/client';

import { hashPassword } from '../src/common/utils/password';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password@123';

const seedDatabase = async (): Promise<void> => {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@cloudmart.com',
    },
    update: {
      name: 'CloudMart Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
    create: {
      name: 'CloudMart Admin',
      email: 'admin@cloudmart.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const vendor = await prisma.user.upsert({
    where: {
      email: 'vendor@cloudmart.com',
    },
    update: {
      name: 'CloudMart Vendor',
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
    create: {
      name: 'CloudMart Vendor',
      email: 'vendor@cloudmart.com',
      passwordHash,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.vendorProfile.upsert({
    where: {
      userId: vendor.id,
    },
    update: {
      storeName: 'CloudMart Electronics',
      slug: 'cloudmart-electronics',
      description: 'Seed vendor store for CloudMart electronics products.',
      status: VendorStatus.APPROVED,
      approvedAt: new Date(),
    },
    create: {
      userId: vendor.id,
      storeName: 'CloudMart Electronics',
      slug: 'cloudmart-electronics',
      description: 'Seed vendor store for CloudMart electronics products.',
      status: VendorStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: {
      email: 'customer@cloudmart.com',
    },
    update: {
      name: 'CloudMart Customer',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
    create: {
      name: 'CloudMart Customer',
      email: 'customer@cloudmart.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.address.upsert({
    where: {
      id: '00000000-0000-0000-0000-000000000101',
    },
    update: {
      userId: customer.id,
      fullName: 'CloudMart Customer',
      phone: '9999999999',
      line1: '123 CloudMart Street',
      line2: 'Near Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560037',
      country: 'India',
      isDefault: true,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: customer.id,
      fullName: 'CloudMart Customer',
      phone: '9999999999',
      line1: '123 CloudMart Street',
      line2: 'Near Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560037',
      country: 'India',
      isDefault: true,
    },
  });

  const electronics = await prisma.category.upsert({
    where: {
      slug: 'electronics',
    },
    update: {
      name: 'Electronics',
    },
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  const mobiles = await prisma.category.upsert({
    where: {
      slug: 'mobiles',
    },
    update: {
      name: 'Mobiles',
      parentId: electronics.id,
    },
    create: {
      name: 'Mobiles',
      slug: 'mobiles',
      parentId: electronics.id,
    },
  });

  const laptops = await prisma.category.upsert({
    where: {
      slug: 'laptops',
    },
    update: {
      name: 'Laptops',
      parentId: electronics.id,
    },
    create: {
      name: 'Laptops',
      slug: 'laptops',
      parentId: electronics.id,
    },
  });

  const iphone = await prisma.product.upsert({
    where: {
      vendorId_slug: {
        vendorId: vendor.id,
        slug: 'iphone-15',
      },
    },
    update: {
      title: 'iPhone 15',
      description: 'Apple iPhone 15 with 128GB storage.',
      price: new Prisma.Decimal('79999.00'),
      stock: 25,
      lowStockThreshold: 5,
      status: ProductStatus.ACTIVE,
      categoryId: mobiles.id,
    },
    create: {
      vendorId: vendor.id,
      categoryId: mobiles.id,
      title: 'iPhone 15',
      slug: 'iphone-15',
      description: 'Apple iPhone 15 with 128GB storage.',
      price: new Prisma.Decimal('79999.00'),
      stock: 25,
      lowStockThreshold: 5,
      status: ProductStatus.ACTIVE,
    },
  });

  const samsung = await prisma.product.upsert({
    where: {
      vendorId_slug: {
        vendorId: vendor.id,
        slug: 'samsung-galaxy-s24',
      },
    },
    update: {
      title: 'Samsung Galaxy S24',
      description: 'Samsung Galaxy S24 flagship Android smartphone.',
      price: new Prisma.Decimal('69999.00'),
      stock: 30,
      lowStockThreshold: 5,
      status: ProductStatus.ACTIVE,
      categoryId: mobiles.id,
    },
    create: {
      vendorId: vendor.id,
      categoryId: mobiles.id,
      title: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'Samsung Galaxy S24 flagship Android smartphone.',
      price: new Prisma.Decimal('69999.00'),
      stock: 30,
      lowStockThreshold: 5,
      status: ProductStatus.ACTIVE,
    },
  });

  const macbook = await prisma.product.upsert({
    where: {
      vendorId_slug: {
        vendorId: vendor.id,
        slug: 'macbook-air-m3',
      },
    },
    update: {
      title: 'MacBook Air M3',
      description: 'Apple MacBook Air with M3 chip and 256GB SSD.',
      price: new Prisma.Decimal('114999.00'),
      stock: 12,
      lowStockThreshold: 3,
      status: ProductStatus.ACTIVE,
      categoryId: laptops.id,
    },
    create: {
      vendorId: vendor.id,
      categoryId: laptops.id,
      title: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      description: 'Apple MacBook Air with M3 chip and 256GB SSD.',
      price: new Prisma.Decimal('114999.00'),
      stock: 12,
      lowStockThreshold: 3,
      status: ProductStatus.ACTIVE,
    },
  });

  const products = [
    {
      product: iphone,
      imageUrl: 'https://example.com/images/iphone-15.jpg',
      altText: 'iPhone 15 product image',
    },
    {
      product: samsung,
      imageUrl: 'https://example.com/images/samsung-galaxy-s24.jpg',
      altText: 'Samsung Galaxy S24 product image',
    },
    {
      product: macbook,
      imageUrl: 'https://example.com/images/macbook-air-m3.jpg',
      altText: 'MacBook Air M3 product image',
    },
  ];

  for (const item of products) {
    await prisma.productImage.upsert({
      where: {
        productId_sortOrder: {
          productId: item.product.id,
          sortOrder: 1,
        },
      },
      update: {
        url: item.imageUrl,
        altText: item.altText,
      },
      create: {
        productId: item.product.id,
        url: item.imageUrl,
        altText: item.altText,
        sortOrder: 1,
      },
    });
  }

  await prisma.inventoryMovement.deleteMany({
    where: {
      reason: 'Initial seed stock',
    },
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: iphone.id,
        type: InventoryMovementType.STOCK_IN,
        quantity: 25,
        reason: 'Initial seed stock',
        actorId: admin.id,
        stockBefore: 0,
        stockAfter: 25,
      },
      {
        productId: samsung.id,
        type: InventoryMovementType.STOCK_IN,
        quantity: 30,
        reason: 'Initial seed stock',
        actorId: admin.id,
        stockBefore: 0,
        stockAfter: 30,
      },
      {
        productId: macbook.id,
        type: InventoryMovementType.STOCK_IN,
        quantity: 12,
        reason: 'Initial seed stock',
        actorId: admin.id,
        stockBefore: 0,
        stockAfter: 12,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'SEED_DATABASE',
      entityType: 'DATABASE',
      entityId: 'cloudmart-local',
      metadataJson: {
        adminEmail: 'admin@cloudmart.com',
        vendorEmail: 'vendor@cloudmart.com',
        customerEmail: 'customer@cloudmart.com',
        productsSeeded: products.length,
      },
    },
  });

  console.log('CloudMart seed completed successfully.');
  console.log('Seed users:');
  console.log(`Admin    -> admin@cloudmart.com / ${DEFAULT_PASSWORD}`);
  console.log(`Vendor   -> vendor@cloudmart.com / ${DEFAULT_PASSWORD}`);
  console.log(`Customer -> customer@cloudmart.com / ${DEFAULT_PASSWORD}`);
};

seedDatabase()
  .catch((error) => {
    console.error('CloudMart seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
