import type { Prisma } from '@prisma/client';

/**
 * Reserves the next value of a named counter.
 *
 * A single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` is atomic in
 * PostgreSQL, so two challans created at the same instant can never be handed
 * the same number — no application level locking required.
 */
const nextSequenceValue = async (tx: Prisma.TransactionClient, key: string): Promise<number> => {
  const rows = await tx.$queryRaw<Array<{ value: number }>>`
    INSERT INTO number_sequences ("key", "value", "updatedAt")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "value" = number_sequences."value" + 1, "updatedAt" = NOW()
    RETURNING "value"
  `;

  return rows[0].value;
};

/**
 * Generates the human readable challan number, e.g. `CH-202608-0004`.
 * The counter restarts each month, which keeps the numbers short and readable.
 */
export const generateChallanNumber = async (
  tx: Prisma.TransactionClient,
  now = new Date(),
): Promise<string> => {
  const period = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const sequence = await nextSequenceValue(tx, `CHALLAN-${period}`);

  return `CH-${period}-${String(sequence).padStart(4, '0')}`;
};
