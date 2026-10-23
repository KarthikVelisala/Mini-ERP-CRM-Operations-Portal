import { ChallanStatus, MovementType, Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginationMeta, toPrismaPagination, type PaginationQuery } from '../../utils/pagination';
import { applyStockMovement } from '../inventory/stock.service';
import { generateChallanNumber } from './challanNumber';
import type {
  CancelChallanInput,
  CreateChallanInput,
  ListChallansQuery,
  UpdateChallanInput,
} from './challan.schema';

const itemSelect = {
  id: true,
  productId: true,
  productName: true,
  productSku: true,
  productCategory: true,
  productLocation: true,
  unitPrice: true,
  quantity: true,
  lineTotal: true,
} satisfies Prisma.SalesChallanItemSelect;

const challanSelect = {
  id: true,
  challanNumber: true,
  status: true,
  totalQuantity: true,
  totalAmount: true,
  notes: true,
  confirmedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      businessName: true,
      mobile: true,
      email: true,
      type: true,
      gstNumber: true,
      address: true,
    },
  },
  createdBy: { select: { id: true, name: true, role: true } },
  items: { select: itemSelect, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.SalesChallanSelect;

type ChallanRow = Prisma.SalesChallanGetPayload<{ select: typeof challanSelect }>;

const serializeChallan = (challan: ChallanRow) => ({
  ...challan,
  totalAmount: Number(challan.totalAmount),
  items: challan.items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
  })),
});

interface ResolvedLine {
  productId: string;
  productName: string;
  productSku: string;
  productCategory: string;
  productLocation: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  lineTotal: Prisma.Decimal;
}

/**
 * Turns the submitted `{ productId, quantity }` pairs into full line items.
 *
 * The product name, SKU, category, location and price are copied onto the
 * challan as a snapshot, so the document keeps showing what was actually sold
 * even if the catalogue is edited or the product is removed later.
 */
const resolveLines = async (
  tx: Prisma.TransactionClient,
  items: CreateChallanInput['items'],
): Promise<ResolvedLine[]> => {
  const products = await tx.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      location: true,
      unitPrice: true,
      isActive: true,
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const missing = items.filter((item) => !byId.has(item.productId));

  if (missing.length > 0) {
    throw ApiError.notFound(
      `Unknown product${missing.length > 1 ? 's' : ''}: ${missing.map((item) => item.productId).join(', ')}`,
    );
  }

  const inactive = items
    .map((item) => byId.get(item.productId)!)
    .filter((product) => !product.isActive);

  if (inactive.length > 0) {
    throw ApiError.business(
      `These products are discontinued and cannot be sold: ${inactive.map((product) => product.sku).join(', ')}`,
      'PRODUCT_INACTIVE',
    );
  }

  return items.map((item) => {
    const product = byId.get(item.productId)!;
    const unitPrice = product.unitPrice;

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productCategory: product.category,
      productLocation: product.location,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice.mul(item.quantity),
    };
  });
};

const totalsFor = (lines: ResolvedLine[]) => ({
  totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
  totalAmount: lines.reduce((sum, line) => sum.add(line.lineTotal), new Prisma.Decimal(0)),
});

/**
 * Releases stock for every line of a challan.
 *
 * Runs inside the caller's transaction: if any single line has insufficient
 * stock the whole transaction is rolled back, so a rejected challan never
 * partially reduces inventory.
 */
const dispatchStock = async (
  tx: Prisma.TransactionClient,
  challan: { id: string; challanNumber: string },
  lines: Array<{ productId: string | null; quantity: number }>,
  createdById: string,
) => {
  for (const line of lines) {
    if (!line.productId) continue;

    await applyStockMovement(tx, {
      productId: line.productId,
      type: MovementType.OUT,
      quantity: line.quantity,
      reason: `Sales challan ${challan.challanNumber}`,
      createdById,
      challanId: challan.id,
    });
  }
};

export const listChallans = async (query: ListChallansQuery) => {
  const { search, status, customerId, from, to, sortBy, sortOrder, ...pagination } = query;

  const contains = search ? ({ contains: search, mode: 'insensitive' } as const) : undefined;

  const where: Prisma.SalesChallanWhereInput = {
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(contains
      ? {
          OR: [
            { challanNumber: contains },
            { customer: { name: contains } },
            { customer: { businessName: contains } },
          ],
        }
      : {}),
  };

  // Concurrent rather than transactional — see the note in customer.service.
  const [items, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      select: challanSelect,
      orderBy: { [sortBy]: sortOrder },
      ...toPrismaPagination(pagination as PaginationQuery),
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return {
    items: items.map(serializeChallan),
    meta: buildPaginationMeta(total, pagination as PaginationQuery),
  };
};

export const getChallanById = async (id: string) => {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    select: {
      ...challanSelect,
      stockMovements: {
        select: {
          id: true,
          type: true,
          quantity: true,
          reason: true,
          balanceAfter: true,
          createdAt: true,
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!challan) {
    throw ApiError.notFound('Challan not found');
  }

  return { ...serializeChallan(challan), stockMovements: challan.stockMovements };
};

/**
 * Creates a challan. When it is created as CONFIRMED the stock reduction runs
 * in the same transaction, so an insufficient stock error leaves no challan
 * behind and no inventory touched.
 */
export const createChallan = async (input: CreateChallanInput, createdById: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, status: true, name: true },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const challanId = await prisma.$transaction(async (tx) => {
    const lines = await resolveLines(tx, input.items);
    const totals = totalsFor(lines);
    const challanNumber = await generateChallanNumber(tx);
    const confirmNow = input.status === ChallanStatus.CONFIRMED;

    const challan = await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        createdById,
        notes: input.notes,
        status: confirmNow ? ChallanStatus.CONFIRMED : ChallanStatus.DRAFT,
        confirmedAt: confirmNow ? new Date() : null,
        totalQuantity: totals.totalQuantity,
        totalAmount: totals.totalAmount,
        items: { create: lines },
      },
      select: { id: true, challanNumber: true },
    });

    if (confirmNow) {
      await dispatchStock(tx, challan, lines, createdById);
    }

    return challan.id;
  }, TRANSACTION_OPTIONS);

  return getChallanById(challanId);
};

/** Drafts remain fully editable; confirmed and cancelled challans do not. */
export const updateChallan = async (id: string, input: UpdateChallanInput) => {
  const existing = await prisma.salesChallan.findUnique({
    where: { id },
    select: { id: true, status: true, challanNumber: true },
  });

  if (!existing) {
    throw ApiError.notFound('Challan not found');
  }

  if (existing.status !== ChallanStatus.DRAFT) {
    throw ApiError.business(
      `Challan ${existing.challanNumber} is ${existing.status.toLowerCase()} and can no longer be edited`,
      'CHALLAN_NOT_EDITABLE',
    );
  }

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
  }

  await prisma.$transaction(async (tx) => {
    const data: Prisma.SalesChallanUpdateInput = {};

    if (input.customerId) {
      data.customer = { connect: { id: input.customerId } };
    }

    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    if (input.items) {
      const lines = await resolveLines(tx, input.items);
      const totals = totalsFor(lines);

      // Draft lines are replaced wholesale — simpler and always consistent.
      await tx.salesChallanItem.deleteMany({ where: { challanId: id } });

      data.items = { create: lines };
      data.totalQuantity = totals.totalQuantity;
      data.totalAmount = totals.totalAmount;
    }

    await tx.salesChallan.update({ where: { id }, data });
  }, TRANSACTION_OPTIONS);

  return getChallanById(id);
};

/**
 * Confirms a draft challan and releases the stock.
 *
 * Stock availability is checked and applied atomically per line inside one
 * transaction, so the API rejects the whole operation the moment any line
 * exceeds what is on hand — stock can never go negative and never partially
 * reduces.
 */
export const confirmChallan = async (id: string, confirmedById: string) => {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    select: {
      id: true,
      challanNumber: true,
      status: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  if (!challan) {
    throw ApiError.notFound('Challan not found');
  }

  if (challan.status === ChallanStatus.CONFIRMED) {
    throw ApiError.business(
      `Challan ${challan.challanNumber} is already confirmed`,
      'CHALLAN_ALREADY_CONFIRMED',
    );
  }

  if (challan.status === ChallanStatus.CANCELLED) {
    throw ApiError.business(
      `Challan ${challan.challanNumber} was cancelled and cannot be confirmed`,
      'CHALLAN_CANCELLED',
    );
  }

  if (challan.items.length === 0) {
    throw ApiError.business(
      `Challan ${challan.challanNumber} has no line items to dispatch`,
      'CHALLAN_EMPTY',
    );
  }

  await prisma.$transaction(async (tx) => {
    await dispatchStock(tx, challan, challan.items, confirmedById);

    await tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CONFIRMED, confirmedAt: new Date() },
    });
  }, TRANSACTION_OPTIONS);

  return getChallanById(id);
};

/**
 * Cancels a challan. Cancelling a confirmed challan returns the dispatched
 * quantities to stock as IN movements, keeping the ledger balanced.
 */
export const cancelChallan = async (
  id: string,
  input: CancelChallanInput,
  cancelledById: string,
) => {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    select: {
      id: true,
      challanNumber: true,
      status: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  if (!challan) {
    throw ApiError.notFound('Challan not found');
  }

  if (challan.status === ChallanStatus.CANCELLED) {
    throw ApiError.business(
      `Challan ${challan.challanNumber} is already cancelled`,
      'CHALLAN_ALREADY_CANCELLED',
    );
  }

  const reason = input.reason
    ? `Challan ${challan.challanNumber} cancelled — ${input.reason}`
    : `Challan ${challan.challanNumber} cancelled`;

  await prisma.$transaction(async (tx) => {
    if (challan.status === ChallanStatus.CONFIRMED) {
      for (const item of challan.items) {
        if (!item.productId) continue;

        await applyStockMovement(tx, {
          productId: item.productId,
          type: MovementType.IN,
          quantity: item.quantity,
          reason,
          createdById: cancelledById,
          challanId: challan.id,
        });
      }
    }

    await tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED, cancelledAt: new Date() },
    });
  }, TRANSACTION_OPTIONS);

  return getChallanById(id);
};

/** Challan counts and value by status, used by the dashboard. */
export const getChallanSummary = async () => {
  const grouped = await prisma.salesChallan.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { totalAmount: true, totalQuantity: true },
  });

  const byStatus = Object.fromEntries(
    Object.values(ChallanStatus).map((status) => {
      const row = grouped.find((entry) => entry.status === status);
      return [
        status,
        {
          count: row?._count._all ?? 0,
          totalAmount: Number(row?._sum.totalAmount ?? 0),
          totalQuantity: row?._sum.totalQuantity ?? 0,
        },
      ];
    }),
  ) as Record<ChallanStatus, { count: number; totalAmount: number; totalQuantity: number }>;

  return {
    byStatus,
    totalChallans: grouped.reduce((sum, row) => sum + row._count._all, 0),
    confirmedValue: byStatus.CONFIRMED.totalAmount,
  };
};
