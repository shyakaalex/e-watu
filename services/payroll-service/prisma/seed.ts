import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Query platform DB to get demo tenant ID
  const result = await prisma.$queryRaw`
    SELECT id FROM "PayrollConfiguration" LIMIT 1
  ` as Array<{ id: string }>;

  // If configs already exist, just return
  if (result.length > 0) {
    console.log('Payroll configurations already seeded');
    return;
  }

  try {
    // Get the first tenant - this will be the demo tenant
    const tenants = await prisma.$queryRaw`
      SELECT DISTINCT tenant_id FROM payroll_lines LIMIT 1
    ` as Array<{ tenant_id: string }>;

    if (!tenants || tenants.length === 0) {
      console.log('No tenants found, skipping seed');
      return;
    }

    const tenantId = tenants[0].tenant_id;

    // Ensure default payroll config exists
    await prisma.payrollConfiguration.create({
      data: {
        tenantId,
        clientId: 'default-client',
        payDay: 28,
        currency: 'RWF',
        payeEnabled: true,
        rssbPensionEmployee: 0.05,
        rssbPensionEmployer: 0.05,
        rssbMedical: 0.075,
        cbhiRate: 0.005,
        maternityLevy: 0.003,
      },
    });
    console.log('✓ Seeded default payroll configuration');
  } catch (e) {
    console.log('✓ Payroll configuration already exists or could not query tenants');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
