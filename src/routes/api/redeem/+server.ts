import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { adjustStars } from '$lib/server/stars';
import { notify } from '$lib/server/notify';
import { publish } from '$lib/server/bus';
import type { RequestHandler } from './$types';

// Child requests a reward; spends stars and logs a redemption (pending parent approval).
export const POST: RequestHandler = async ({ request }) => {
  const { rewardId, profileId, client } = await request.json();
  if (!rewardId || !profileId) throw error(400, 'rewardId and profileId required');

  const [reward, profile] = await Promise.all([
    db.reward.findUnique({ where: { id: rewardId } }),
    db.profile.findUnique({ where: { id: profileId } })
  ]);
  if (!reward || !reward.active) throw error(404, 'Reward not available');
  if (!profile) throw error(404, 'Profile not found');
  if (profile.stars < reward.cost) throw error(400, 'Not enough stars');

  await db.redemption.create({
    data: { rewardId, profileId, costAtTime: reward.cost, status: 'REQUESTED' }
  });
  const updated = await adjustStars(profileId, -reward.cost, 'REDEEM', reward.title);

  notify('Reward requested', `${profile.name} redeemed "${reward.title}" (-${reward.cost})`, ['gift']);
  publish({ profileId, kind: 'redeem', source: client });

  return json({ ok: true, stars: updated.stars });
};
