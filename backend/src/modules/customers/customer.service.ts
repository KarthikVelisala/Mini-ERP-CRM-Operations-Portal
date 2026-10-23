import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginationMeta, toPrismaPagination, type PaginationQuery } from '../../utils/pagination';
import type {
  CreateCustomerInput,
  CreateFollowUpInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from './customer.schema';

const followUpSelect = {
  id: true,
  note: true,
  followUpDate: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.CustomerFollowUpSelect;

const customerSelect = {
  id: true,
  name: true,
  mobile: true,
  email: true,
  businessName: true,
  gstNumber: true,
  type: true,
  address: true,
  status: true,
  followUpDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.CustomerSelect;

const buildSearchFilter = (search?: string): Prisma.CustomerWhereInput | undefined => {
  if (!search) return undefined;

  const contains = { contains: search, mode: 'insensitive' } as const;

  return {
    OR: [
      { name: contains },
      { businessName: contains },
      { email: contains },
      { mobile: { contains: search } },
      { gstNumber: contains },
    ],
  };
};

export const listCustomers = async (query: ListCustomersQuery) => {
  const { search, status, type, followUpDue, sortBy, sortOrder, ...pagination } = query;

  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(followUpDue ? { followUpDate: { not: null, lte: new Date() } } : {}),
    ...(buildSearchFilter(search) ?? {}),
  };

  // `Promise.all` rather than `$transaction`: the rows and the count run
  // concurrently instead of paying for BEGIN/COMMIT round trips. A paginated
  // list does not need a single snapshot — a momentary skew between the count
  // and the page under concurrent writes is harmless.
  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        ...customerSelect,
        _count: { select: { followUps: true, challans: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      ...toPrismaPagination(pagination as PaginationQuery),
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination as PaginationQuery) };
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      ...customerSelect,
      followUps: {
        select: followUpSelect,
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      challans: {
        select: {
          id: true,
          challanNumber: true,
          status: true,
          totalQuantity: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { followUps: true, challans: true } },
    },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  return {
    ...customer,
    challans: customer.challans.map((challan) => ({
      ...challan,
      totalAmount: Number(challan.totalAmount),
    })),
  };
};

export const createCustomer = async (input: CreateCustomerInput, createdById: string) => {
  const existing = await prisma.customer.findUnique({
    where: { mobile: input.mobile },
    select: { id: true, name: true },
  });

  if (existing) {
    throw ApiError.conflict(
      `Mobile number ${input.mobile} is already registered to ${existing.name}`,
    );
  }

  return prisma.customer.create({
    data: { ...input, createdById },
    select: customerSelect,
  });
};

export const updateCustomer = async (id: string, input: UpdateCustomerInput) => {
  const existing = await prisma.customer.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    throw ApiError.notFound('Customer not found');
  }

  if (input.mobile) {
    const duplicate = await prisma.customer.findFirst({
      where: { mobile: input.mobile, NOT: { id } },
      select: { name: true },
    });

    if (duplicate) {
      throw ApiError.conflict(
        `Mobile number ${input.mobile} is already registered to ${duplicate.name}`,
      );
    }
  }

  return prisma.customer.update({
    where: { id },
    data: input,
    select: customerSelect,
  });
};

export const listFollowUps = async (customerId: string, pagination: PaginationQuery) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const where: Prisma.CustomerFollowUpWhereInput = { customerId };

  const [items, total] = await Promise.all([
    prisma.customerFollowUp.findMany({
      where,
      select: followUpSelect,
      orderBy: { createdAt: 'desc' },
      ...toPrismaPagination(pagination),
    }),
    prisma.customerFollowUp.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
};

/**
 * Records a follow-up note. When the note carries a next follow-up date the
 * customer's own `followUpDate` is moved forward in the same transaction, so
 * the CRM list always reflects the latest agreed contact date.
 */
export const addFollowUp = async (
  customerId: string,
  input: CreateFollowUpInput,
  createdById: string,
) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  return prisma.$transaction(async (tx) => {
    const followUp = await tx.customerFollowUp.create({
      data: {
        customerId,
        note: input.note,
        followUpDate: input.followUpDate,
        createdById,
      },
      select: followUpSelect,
    });

    if (input.followUpDate) {
      await tx.customer.update({
        where: { id: customerId },
        data: { followUpDate: input.followUpDate },
      });
    }

    return followUp;
  }, TRANSACTION_OPTIONS);
};
