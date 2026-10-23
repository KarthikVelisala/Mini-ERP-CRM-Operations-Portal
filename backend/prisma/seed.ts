import {
  ChallanStatus,
  CustomerStatus,
  CustomerType,
  MovementType,
  Prisma,
  PrismaClient,
  Role,
} from '@prisma/client';
import { env } from '../src/config/env';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

/**
 * Demo accounts, one per role, used for local development and for the test
 * credentials published in the README. The password comes from
 * SEED_DEFAULT_PASSWORD so it is never hard coded in the repository.
 */
const USERS: Array<{ name: string; email: string; role: Role }> = [
  { name: 'Aarti Menon', email: 'admin@minierp.com', role: Role.ADMIN },
  { name: 'Rohan Kulkarni', email: 'sales@minierp.com', role: Role.SALES },
  { name: 'Imran Sheikh', email: 'warehouse@minierp.com', role: Role.WAREHOUSE },
  { name: 'Neha Bansal', email: 'accounts@minierp.com', role: Role.ACCOUNTS },
];

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const CUSTOMERS = [
  {
    name: 'Suresh Iyer',
    mobile: '9820011223',
    email: 'suresh@shreetraders.in',
    businessName: 'Shree Traders',
    gstNumber: '27AAECS1234F1Z5',
    type: CustomerType.DISTRIBUTOR,
    address: '14 Kalbadevi Road, Mumbai, Maharashtra 400002',
    status: CustomerStatus.ACTIVE,
    followUpDate: daysFromNow(3),
    notes: 'Places bulk orders every fortnight. Prefers dispatch before noon.',
  },
  {
    name: 'Priya Raghavan',
    mobile: '9845567788',
    email: 'priya@nandinistores.com',
    businessName: 'Nandini Stores',
    gstNumber: '29AACCN9876H1Z2',
    type: CustomerType.WHOLESALE,
    address: '8th Cross, Jayanagar, Bengaluru, Karnataka 560011',
    status: CustomerStatus.ACTIVE,
    followUpDate: daysFromNow(1),
    notes: 'Requested a revised rate card for packaged goods.',
  },
  {
    name: 'Vikram Chauhan',
    mobile: '9911223344',
    email: 'vikram@chauhanretail.in',
    businessName: 'Chauhan Retail Mart',
    gstNumber: null,
    type: CustomerType.RETAIL,
    address: 'Shop 22, Karol Bagh, New Delhi 110005',
    status: CustomerStatus.LEAD,
    followUpDate: daysFromNow(5),
    notes: 'Walk-in enquiry from the trade expo. Needs a sample consignment.',
  },
  {
    name: 'Meera Das',
    mobile: '9830099887',
    email: 'meera@dasenterprises.co.in',
    businessName: 'Das Enterprises',
    gstNumber: '19AAGCD4455K1Z8',
    type: CustomerType.WHOLESALE,
    address: '12B Park Street, Kolkata, West Bengal 700016',
    status: CustomerStatus.ACTIVE,
    followUpDate: daysFromNow(-2),
    notes: 'Payment terms extended to 30 days from this quarter.',
  },
  {
    name: 'Anil Prakash',
    mobile: '9700112233',
    email: 'anil@prakashagencies.com',
    businessName: 'Prakash Agencies',
    gstNumber: '36AABCP7788L1Z0',
    type: CustomerType.DISTRIBUTOR,
    address: 'Plot 45, Begumpet, Hyderabad, Telangana 500016',
    status: CustomerStatus.INACTIVE,
    followUpDate: null,
    notes: 'Dormant since the last season. Worth re-engaging before the festive cycle.',
  },
];

const PRODUCTS = [
  {
    name: 'Basmati Rice 25kg Bag',
    sku: 'GRN-RICE-25',
    category: 'Grains',
    unitPrice: 2150,
    openingStock: 240,
    minStockAlert: 40,
    location: 'Bhiwandi Warehouse A',
  },
  {
    name: 'Refined Sunflower Oil 15L Tin',
    sku: 'OIL-SUN-15',
    category: 'Edible Oils',
    unitPrice: 1875.5,
    openingStock: 120,
    minStockAlert: 30,
    location: 'Bhiwandi Warehouse A',
  },
  {
    name: 'Toor Dal 30kg Sack',
    sku: 'PLS-TOOR-30',
    category: 'Pulses',
    unitPrice: 4260,
    openingStock: 64,
    minStockAlert: 20,
    location: 'Bhiwandi Warehouse B',
  },
  {
    name: 'Iodised Salt 1kg (Carton of 24)',
    sku: 'STP-SALT-24',
    category: 'Staples',
    unitPrice: 468,
    openingStock: 18,
    minStockAlert: 25,
    location: 'Bhiwandi Warehouse B',
  },
  {
    name: 'Detergent Powder 5kg',
    sku: 'HHD-DTG-05',
    category: 'Household',
    unitPrice: 615,
    openingStock: 0,
    minStockAlert: 15,
    location: 'Pune Depot',
  },
  {
    name: 'Assorted Biscuits (Case of 48)',
    sku: 'SNK-BIS-48',
    category: 'Snacks',
    unitPrice: 1340,
    openingStock: 96,
    minStockAlert: 24,
    location: 'Pune Depot',
  },
  {
    name: 'Packaged Drinking Water 1L (Case of 12)',
    sku: 'BEV-WTR-12',
    category: 'Beverages',
    unitPrice: 168,
    openingStock: 310,
    minStockAlert: 60,
    location: 'Pune Depot',
  },
  {
    name: 'Wheat Flour 10kg Pack',
    sku: 'GRN-ATA-10',
    category: 'Grains',
    unitPrice: 430,
    openingStock: 145,
    minStockAlert: 35,
    location: 'Bhiwandi Warehouse A',
  },
];

const seedUsers = async () => {
  const passwordHash = await hashPassword(env.SEED_DEFAULT_PASSWORD);

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true },
      create: { ...user, passwordHash },
    });
  }

  console.log(`Seeded ${USERS.length} users (password: ${env.SEED_DEFAULT_PASSWORD})`);
};

const seedCustomers = async (salesUserId: string) => {
  for (const customer of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { mobile: customer.mobile },
      update: {},
      create: { ...customer, createdById: salesUserId },
    });
  }

  console.log(`Seeded ${CUSTOMERS.length} customers`);
};

const seedFollowUps = async (salesUserId: string) => {
  const shreeTraders = await prisma.customer.findUnique({ where: { mobile: '9820011223' } });

  if (!shreeTraders) return;

  const alreadySeeded = await prisma.customerFollowUp.count({
    where: { customerId: shreeTraders.id },
  });

  if (alreadySeeded > 0) return;

  await prisma.customerFollowUp.createMany({
    data: [
      {
        customerId: shreeTraders.id,
        note: 'Shared the updated distributor price list over email.',
        followUpDate: daysFromNow(3),
        createdById: salesUserId,
      },
      {
        customerId: shreeTraders.id,
        note: 'Confirmed the next consignment window for the first week of the month.',
        followUpDate: null,
        createdById: salesUserId,
      },
    ],
  });

  console.log('Seeded customer follow-ups');
};

/**
 * Products are created with zero stock and then topped up through a real IN
 * movement, so the seeded ledger reconciles with `currentStock` exactly the way
 * the running application maintains it.
 */
const seedProducts = async (warehouseUserId: string) => {
  for (const { openingStock, ...product } of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { sku: product.sku } });

    if (existing) continue;

    const created = await prisma.product.create({
      data: { ...product, currentStock: 0, createdById: warehouseUserId },
    });

    if (openingStock > 0) {
      await prisma.$transaction([
        prisma.product.update({
          where: { id: created.id },
          data: { currentStock: openingStock },
        }),
        prisma.stockMovement.create({
          data: {
            productId: created.id,
            type: MovementType.IN,
            quantity: openingStock,
            reason: 'Opening stock',
            balanceAfter: openingStock,
            createdById: warehouseUserId,
          },
        }),
      ]);
    }
  }

  console.log(`Seeded ${PRODUCTS.length} products with opening stock movements`);
};

interface SeededChallan {
  customerMobile: string;
  status: ChallanStatus;
  /** Days before today the challan was raised. */
  daysAgo: number;
  notes?: string;
  lines: Array<{ sku: string; quantity: number }>;
}

const CHALLANS: SeededChallan[] = [
  {
    customerMobile: '9820011223',
    status: ChallanStatus.CONFIRMED,
    daysAgo: 128,
    notes: 'Monthly distributor consignment.',
    lines: [
      { sku: 'GRN-RICE-25', quantity: 18 },
      { sku: 'OIL-SUN-15', quantity: 10 },
    ],
  },
  {
    customerMobile: '9845567788',
    status: ChallanStatus.CONFIRMED,
    daysAgo: 96,
    lines: [
      { sku: 'BEV-WTR-12', quantity: 40 },
      { sku: 'SNK-BIS-48', quantity: 12 },
    ],
  },
  {
    customerMobile: '9830099887',
    status: ChallanStatus.CONFIRMED,
    daysAgo: 61,
    notes: 'Dispatched via Kolkata transport partner.',
    lines: [
      { sku: 'GRN-ATA-10', quantity: 25 },
      { sku: 'PLS-TOOR-30', quantity: 6 },
    ],
  },
  {
    customerMobile: '9820011223',
    status: ChallanStatus.CONFIRMED,
    daysAgo: 34,
    lines: [
      { sku: 'GRN-RICE-25', quantity: 22 },
      { sku: 'GRN-ATA-10', quantity: 15 },
      { sku: 'BEV-WTR-12', quantity: 30 },
    ],
  },
  {
    customerMobile: '9845567788',
    status: ChallanStatus.CONFIRMED,
    daysAgo: 12,
    notes: 'Festive season top-up order.',
    lines: [
      { sku: 'SNK-BIS-48', quantity: 20 },
      { sku: 'OIL-SUN-15', quantity: 8 },
    ],
  },
  {
    customerMobile: '9830099887',
    status: ChallanStatus.CANCELLED,
    daysAgo: 8,
    notes: 'Customer postponed the delivery window.',
    lines: [{ sku: 'PLS-TOOR-30', quantity: 4 }],
  },
  {
    customerMobile: '9911223344',
    status: ChallanStatus.DRAFT,
    daysAgo: 2,
    notes: 'Trial consignment awaiting customer confirmation.',
    lines: [
      { sku: 'BEV-WTR-12', quantity: 10 },
      { sku: 'SNK-BIS-48', quantity: 4 },
    ],
  },
];

/**
 * Builds a believable trading history. Confirmed challans go through the same
 * stock arithmetic the application uses — quantities are decremented and an OUT
 * movement is written — so the seeded ledger reconciles exactly.
 */
const seedChallans = async (salesUserId: string) => {
  if ((await prisma.salesChallan.count()) > 0) {
    return;
  }

  const monthlyCounters = new Map<string, number>();

  for (const spec of CHALLANS) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - spec.daysAgo);

    const period = `${createdAt.getUTCFullYear()}${String(createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
    const sequence = (monthlyCounters.get(period) ?? 0) + 1;
    monthlyCounters.set(period, sequence);

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { mobile: spec.customerMobile },
    });

    const products = await Promise.all(
      spec.lines.map((line) => prisma.product.findUniqueOrThrow({ where: { sku: line.sku } })),
    );

    const items = spec.lines.map((line, index) => {
      const product = products[index];
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productCategory: product.category,
        productLocation: product.location,
        unitPrice: product.unitPrice,
        quantity: line.quantity,
        lineTotal: product.unitPrice.mul(line.quantity),
        createdAt,
      };
    });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum.add(item.lineTotal),
      new Prisma.Decimal(0),
    );

    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber: `CH-${period}-${String(sequence).padStart(4, '0')}`,
        customerId: customer.id,
        createdById: salesUserId,
        status: spec.status,
        notes: spec.notes ?? null,
        totalQuantity,
        totalAmount,
        createdAt,
        confirmedAt: spec.status === ChallanStatus.CONFIRMED ? createdAt : null,
        cancelledAt: spec.status === ChallanStatus.CANCELLED ? createdAt : null,
        items: { create: items },
      },
    });

    if (spec.status !== ChallanStatus.CONFIRMED) continue;

    for (const item of items) {
      const updated = await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
        select: { currentStock: true },
      });

      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: MovementType.OUT,
          quantity: item.quantity,
          reason: `Sales challan ${challan.challanNumber}`,
          balanceAfter: updated.currentStock,
          challanId: challan.id,
          createdById: salesUserId,
          createdAt,
        },
      });
    }
  }

  // Keep the runtime number generator in step with the seeded documents.
  for (const [period, value] of monthlyCounters) {
    await prisma.numberSequence.upsert({
      where: { key: `CHALLAN-${period}` },
      update: { value },
      create: { key: `CHALLAN-${period}`, value },
    });
  }

  console.log(`Seeded ${CHALLANS.length} sales challans with matching stock movements`);
};

const main = async () => {
  await seedUsers();

  const salesUser = await prisma.user.findUniqueOrThrow({ where: { email: 'sales@minierp.com' } });
  const warehouseUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'warehouse@minierp.com' },
  });

  await seedCustomers(salesUser.id);
  await seedFollowUps(salesUser.id);
  await seedProducts(warehouseUser.id);
  await seedChallans(salesUser.id);
};

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
