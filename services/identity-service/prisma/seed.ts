import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEV_PASSWORD = 'DevPassword12!';
const BCRYPT_ROUNDS = 12;

async function demoTenantId(): Promise<string | null> {
  try {
    const platformPrisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://ewatu:ewatu_dev@127.0.0.1:15432/platform_db',
        },
      },
    });
    const result = await platformPrisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Tenant" WHERE slug = 'demo-tenant' LIMIT 1
    `;
    await platformPrisma.$disconnect();
    return result[0]?.id || null;
  } catch (err) {
    return null;
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@ewatu.dev' },
    update: {
      passwordHash,
      emailVerified: true,
      roles: ['PLATFORM_SUPER_ADMIN'],
      emailVerificationToken: null,
      tenantId: null,
    },
    create: {
      email: 'admin@ewatu.dev',
      passwordHash,
      displayName: 'Dev Platform Admin',
      roles: ['PLATFORM_SUPER_ADMIN'],
      emailVerified: true,
    },
  });

  const tenantId = await demoTenantId();
  await prisma.user.upsert({
    where: { email: 'tenant@ewatu.dev' },
    update: {
      passwordHash,
      emailVerified: true,
      roles: ['TENANT_ADMIN'],
      emailVerificationToken: null,
      ...(tenantId ? { tenantId } : {}),
    },
    create: {
      email: 'tenant@ewatu.dev',
      passwordHash,
      displayName: 'Demo Company Admin',
      roles: ['TENANT_ADMIN'],
      emailVerified: true,
      tenantId: tenantId ?? undefined,
    },
  });

  console.log('\nDev login accounts (local only):\n');
  console.log('  Platform admin → admin@ewatu.dev / DevPassword12!');
  console.log('  Company admin  → tenant@ewatu.dev / DevPassword12!');
  if (!tenantId) {
    console.log('\n  (Run platform seed for demo-tenant to link tenant@ewatu.dev to a company.)\n');
  } else {
    console.log(`\n  tenant@ewatu.dev linked to demo-tenant (${tenantId})\n`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
