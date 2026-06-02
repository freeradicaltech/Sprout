import { db } from './db';
import type { StarReason } from '@prisma/client';

/**
 * Adjust a profile's star balance and write a ledger entry in one transaction.
 * The ledger (StarEntry) is the source of truth; Profile.stars is a cache.
 */
export async function adjustStars(
  profileId: string,
  amount: number,
  reason: StarReason,
  note?: string
) {
  return db.$transaction(async (tx) => {
    await tx.starEntry.create({ data: { profileId, amount, reason, note } });
    return tx.profile.update({
      where: { id: profileId },
      data: { stars: { increment: amount } }
    });
  });
}
