import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    }),
    prisma.role.upsert({
      where: { name: 'SUPERVISOR' },
      update: {},
      create: { name: 'SUPERVISOR' },
    }),
    prisma.role.upsert({
      where: { name: 'TECHNICIAN' },
      update: {},
      create: { name: 'TECHNICIAN' },
    }),
    prisma.role.upsert({
      where: { name: 'REQUESTOR' },
      update: {},
      create: { name: 'REQUESTOR' },
    }),
  ]);
  console.log(`✅ Created ${roles.length} roles`);

  // Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@archibus.com' },
    update: {},
    create: {
      email: 'admin@archibus.com',
      name: 'Admin User',
      passwordHash,
      roles: {
        create: {
          roleId: roles.find(r => r.name === 'ADMIN')!.id,
        },
      },
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@archibus.com' },
    update: {},
    create: {
      email: 'supervisor@archibus.com',
      name: 'Supervisor User',
      passwordHash,
      roles: {
        create: {
          roleId: roles.find(r => r.name === 'SUPERVISOR')!.id,
        },
      },
    },
  });

  const technicianUser = await prisma.user.upsert({
    where: { email: 'technician@archibus.com' },
    update: {},
    create: {
      email: 'technician@archibus.com',
      name: 'John Technician',
      passwordHash,
      roles: {
        create: {
          roleId: roles.find(r => r.name === 'TECHNICIAN')!.id,
        },
      },
    },
  });

  const requestorUser = await prisma.user.upsert({
    where: { email: 'requestor@archibus.com' },
    update: {},
    create: {
      email: 'requestor@archibus.com',
      name: 'Jane Requestor',
      passwordHash,
      roles: {
        create: {
          roleId: roles.find(r => r.name === 'REQUESTOR')!.id,
        },
      },
    },
  });

  console.log('✅ Created 4 users (admin, supervisor, technician, requestor)');

  // Create Trades
  console.log('Creating trades...');
  const trades = await Promise.all([
    prisma.trade.upsert({
      where: { code: 'ELEC' },
      update: {},
      create: { code: 'ELEC', name: 'Electrical' },
    }),
    prisma.trade.upsert({
      where: { code: 'PLUMB' },
      update: {},
      create: { code: 'PLUMB', name: 'Plumbing' },
    }),
    prisma.trade.upsert({
      where: { code: 'HVAC' },
      update: {},
      create: { code: 'HVAC', name: 'HVAC' },
    }),
    prisma.trade.upsert({
      where: { code: 'CARP' },
      update: {},
      create: { code: 'CARP', name: 'Carpentry' },
    }),
  ]);
  console.log(`✅ Created ${trades.length} trades`);

  // Create Technician profile
  console.log('Creating technician profile...');
  const technician = await prisma.technician.upsert({
    where: { userId: technicianUser.id },
    update: {},
    create: {
      userId: technicianUser.id,
      tradeId: trades[0].id, // Electrical
      phone: '+1-555-0100',
    },
  });
  console.log('✅ Created technician profile');

  // Create Sites
  console.log('Creating sites...');
  const site1 = await prisma.site.upsert({
    where: { code: 'HQ' },
    update: {},
    create: { code: 'HQ', name: 'Headquarters Campus' },
  });
  const site2 = await prisma.site.upsert({
    where: { code: 'WEST' },
    update: {},
    create: { code: 'WEST', name: 'West Campus' },
  });
  console.log('✅ Created 2 sites');

  // Create Buildings
  console.log('Creating buildings...');
  const building1 = await prisma.building.upsert({
    where: { siteId_code: { siteId: site1.id, code: 'BLDG-A' } },
    update: {},
    create: { siteId: site1.id, code: 'BLDG-A', name: 'Building A' },
  });
  const building2 = await prisma.building.upsert({
    where: { siteId_code: { siteId: site1.id, code: 'BLDG-B' } },
    update: {},
    create: { siteId: site1.id, code: 'BLDG-B', name: 'Building B' },
  });
  console.log('✅ Created 2 buildings');

  // Create Floors
  console.log('Creating floors...');
  const floor1 = await prisma.floor.upsert({
    where: { buildingId_code: { buildingId: building1.id, code: 'F1' } },
    update: {},
    create: { buildingId: building1.id, code: 'F1', name: 'Floor 1' },
  });
  const floor2 = await prisma.floor.upsert({
    where: { buildingId_code: { buildingId: building1.id, code: 'F2' } },
    update: {},
    create: { buildingId: building1.id, code: 'F2', name: 'Floor 2' },
  });
  console.log('✅ Created 2 floors');

  // Create Rooms
  console.log('Creating rooms...');
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { floorId_code: { floorId: floor1.id, code: '101' } },
      update: {},
      create: { floorId: floor1.id, code: '101', name: 'Room 101' },
    }),
    prisma.room.upsert({
      where: { floorId_code: { floorId: floor1.id, code: '102' } },
      update: {},
      create: { floorId: floor1.id, code: '102', name: 'Room 102' },
    }),
    prisma.room.upsert({
      where: { floorId_code: { floorId: floor1.id, code: '103' } },
      update: {},
      create: { floorId: floor1.id, code: '103', name: 'Room 103' },
    }),
    prisma.room.upsert({
      where: { floorId_code: { floorId: floor2.id, code: '201' } },
      update: {},
      create: { floorId: floor2.id, code: '201', name: 'Room 201' },
    }),
    prisma.room.upsert({
      where: { floorId_code: { floorId: floor2.id, code: '202' } },
      update: {},
      create: { floorId: floor2.id, code: '202', name: 'Room 202' },
    }),
  ]);
  console.log(`✅ Created ${rooms.length} rooms`);

  // Create Problem Types
  console.log('Creating problem types...');
  const problemTypes = await Promise.all([
    prisma.problemType.upsert({
      where: { code: 'ELEC-OUT' },
      update: {},
      create: {
        code: 'ELEC-OUT',
        name: 'Electrical Outlet Issue',
        description: 'Problems with electrical outlets or power supply',
      },
    }),
    prisma.problemType.upsert({
      where: { code: 'LIGHT-OUT' },
      update: {},
      create: {
        code: 'LIGHT-OUT',
        name: 'Lighting Problem',
        description: 'Light bulb replacement or fixture issues',
      },
    }),
    prisma.problemType.upsert({
      where: { code: 'HVAC-TEMP' },
      update: {},
      create: {
        code: 'HVAC-TEMP',
        name: 'Temperature Control',
        description: 'Heating or cooling not working properly',
      },
    }),
    prisma.problemType.upsert({
      where: { code: 'PLUMB-LEAK' },
      update: {},
      create: {
        code: 'PLUMB-LEAK',
        name: 'Plumbing Leak',
        description: 'Water leaks or drainage issues',
      },
    }),
    prisma.problemType.upsert({
      where: { code: 'DOOR-LOCK' },
      update: {},
      create: {
        code: 'DOOR-LOCK',
        name: 'Door/Lock Issue',
        description: 'Problems with doors, locks, or access',
      },
    }),
  ]);
  console.log(`✅ Created ${problemTypes.length} problem types`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Sample credentials:');
  console.log('   Admin:      admin@archibus.com / password123');
  console.log('   Supervisor: supervisor@archibus.com / password123');
  console.log('   Technician: technician@archibus.com / password123');
  console.log('   Requestor:  requestor@archibus.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
