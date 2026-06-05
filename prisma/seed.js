// Seed a demo household so the kiosk is usable immediately after setup.
// Run with: npm run db:seed
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';
const db = new PrismaClient();

// Mirror src/lib/server/pin.ts so the seeded PIN is stored hashed, not plain.
function hashPin(pin) {
  const salt = randomBytes(16);
  return `s2$${salt.toString('hex')}$${scryptSync(pin, salt, 64).toString('hex')}`;
}

async function main() {
  // Wipe (dev convenience) — comment out to keep existing data.
  await db.taskCompletion.deleteMany();
  await db.task.deleteMany();
  await db.routine.deleteMany();
  await db.redemption.deleteMany();
  await db.reward.deleteMany();
  await db.starEntry.deleteMany();
  await db.reminder.deleteMany();
  await db.profile.deleteMany();
  await db.household.deleteMany();

  const household = await db.household.create({
    data: { name: 'Demo Family', parentPin: hashPin('1234') } // change/remove the PIN!
  });

  const everyDay = '0,1,2,3,4,5,6';
  const schoolDays = '1,2,3,4,5';

  // --- Child: Ava ---
  const ava = await db.profile.create({
    data: { householdId: household.id, name: 'Ava', avatar: 'unicorn', theme: 'grape', role: 'CHILD' }
  });
  await db.routine.create({
    data: {
      profileId: ava.id, name: 'Morning Routine', slot: 'AM', activeDays: schoolDays, order: 0,
      tasks: {
        create: [
          { title: 'Get dressed', icon: 'shirt', order: 0, stars: 1 },
          { title: 'Brush teeth', icon: 'toothbrush', order: 1, stars: 1 },
          { title: 'Eat breakfast', icon: 'plate', order: 2, stars: 1 },
          { title: 'Pack school bag', icon: 'backpack', order: 3, stars: 2 }
        ]
      }
    }
  });
  await db.routine.create({
    data: {
      profileId: ava.id, name: 'Bedtime Routine', slot: 'PM', activeDays: everyDay, order: 1,
      tasks: {
        create: [
          { title: 'Pyjamas on', icon: 'shirt', order: 0, stars: 1 },
          { title: 'Brush teeth', icon: 'toothbrush', order: 1, stars: 1 },
          { title: 'Read a book', icon: 'book', type: 'TIMED', durationSec: 600, order: 2, stars: 2 }
        ]
      }
    }
  });

  // --- Child: Leo ---
  const leo = await db.profile.create({
    data: { householdId: household.id, name: 'Leo', avatar: 'dino', theme: 'forest', role: 'CHILD' }
  });
  await db.routine.create({
    data: {
      profileId: leo.id, name: 'Morning Routine', slot: 'AM', activeDays: everyDay, order: 0,
      tasks: {
        create: [
          { title: 'Make bed', icon: 'bed', order: 0, stars: 1 },
          { title: 'Get dressed', icon: 'shirt', order: 1, stars: 1 },
          { title: 'Feed the dog', icon: 'dog', order: 2, stars: 2 }
        ]
      }
    }
  });

  // --- Rewards ---
  await db.reward.createMany({
    data: [
      { householdId: household.id, title: '30 min screen time', icon: 'gift', cost: 5 },
      { householdId: household.id, title: 'Choose dinner', icon: 'plate', cost: 10 },
      { householdId: household.id, title: 'Trip to the park', icon: 'star', cost: 15 }
    ]
  });

  console.log('Seeded demo family. Parent PIN: 1234 (change it!)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
