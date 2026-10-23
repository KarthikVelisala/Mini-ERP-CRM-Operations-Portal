import { ChallanStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';
import { optionalDate, optionalText, positiveQuantity } from '../../utils/validators';

const challanItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .trim()
    .min(1, 'Product is required'),
  quantity: positiveQuantity('Quantity'),
});

const itemsSchema = z
  .array(challanItemSchema, { required_error: 'At least one product is required' })
  .min(1, 'Add at least one product to the challan')
  .max(100, 'A challan cannot contain more than 100 line items')
  .superRefine((items, ctx) => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'productId'],
          message: 'Each product can only appear once on a challan',
        });
      }
      seen.add(item.productId);
    });
  });

export const createChallanSchema = z.object({
  customerId: z
    .string({ required_error: 'Customer is required' })
    .trim()
    .min(1, 'Customer is required'),
  items: itemsSchema,
  notes: optionalText('Notes', 1000),
  /** A challan can be saved as a draft or confirmed straight away. */
  status: z
    .enum([ChallanStatus.DRAFT, ChallanStatus.CONFIRMED], {
      invalid_type_error: 'Status must be DRAFT or CONFIRMED',
    })
    .default(ChallanStatus.DRAFT),
});

/** Only draft challans can be edited; confirmed documents are immutable. */
export const updateChallanSchema = z
  .object({
    customerId: z.string().trim().min(1, 'Customer is required'),
    items: itemsSchema,
    notes: optionalText('Notes', 1000),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listChallansQuerySchema = paginationQuerySchema.extend({
  /** Free text match across challan number, customer name and business name. */
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().trim().min(1).optional(),
  from: optionalDate('From date'),
  to: optionalDate('To date'),
  sortBy: z.enum(['createdAt', 'challanNumber', 'totalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const challanIdParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid challan id is required'),
});

export const cancelChallanSchema = z.object({
  reason: optionalText('Cancellation reason', 200),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ListChallansQuery = z.infer<typeof listChallansQuerySchema>;
export type CancelChallanInput = z.infer<typeof cancelChallanSchema>;
