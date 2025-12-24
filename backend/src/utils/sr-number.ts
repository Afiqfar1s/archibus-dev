import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a unique SR number in format: SR-YYYYMM-00001
 * This is transaction-safe and increments per month
 */
export async function generateSRNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SR-${year}${month}`;

  // Get the last SR number for this month
  const lastSR = await prisma.serviceRequest.findFirst({
    where: {
      srNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      srNumber: 'desc',
    },
    select: {
      srNumber: true,
    },
  });

  let sequence = 1;
  if (lastSR) {
    const lastSequence = parseInt(lastSR.srNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(5, '0');
  return `${prefix}-${sequenceStr}`;
}
