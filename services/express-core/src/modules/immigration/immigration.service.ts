import { executeQuery, executeTransaction } from '../../db/client';

export interface PermitCaseInput {
  employeeId: string;
  permitNumber: string;
  permitType: string; // WORK_PERMIT, VISA, RESIDENCE_PERMIT
  country?: string; // default 'RW'
  expiryDate: string; // YYYY-MM-DD
}

/**
 * Creates a permit case and automatically constructs its dynamic document checklist requirements.
 */
export async function createPermitCase(tenantId: string, input: PermitCaseInput) {
  const country = input.country || 'RW';

  return executeTransaction(async (client) => {
    // 1. Insert Permit Record
    const insertPermit = `
      INSERT INTO permits (tenant_id, employee_id, permit_number, permit_type, country, expiry_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')
      RETURNING *
    `;
    const permitRes = await client.query(insertPermit, [
      tenantId,
      input.employeeId,
      input.permitNumber,
      input.permitType,
      country,
      input.expiryDate
    ]);
    const permit = permitRes.rows[0];

    // 2. Define Dynamic Document Checklists
    let checklistTemplates: string[] = [];
    if (input.permitType === 'WORK_PERMIT') {
      if (country === 'RW') {
        checklistTemplates = [
          'Passport Bio Page Copy',
          'Academic Degree Certificate',
          'Signed Employment Contract',
          'RRA Tax Clearance Certificate',
          'Rwanda Police Clearance Certificate'
        ];
      } else {
        checklistTemplates = [
          'Passport Copy',
          'Signed Employment Contract',
          'Police Clearance Certificate'
        ];
      }
    } else if (input.permitType === 'VISA') {
      checklistTemplates = [
        'Passport Copy',
        'Official Invitation Letter',
        'Recent Passport Photo',
        'Proof of Yellow Fever Vaccination'
      ];
    } else {
      checklistTemplates = [
        'Passport Copy',
        'Local Address Declaration Form',
        'Sponsor Letter'
      ];
    }

    // 3. Populate Checklist Items
    const insertedChecklist: any[] = [];
    for (const docName of checklistTemplates) {
      const insertItem = `
        INSERT INTO permit_checklist_items (tenant_id, permit_id, document_name, status)
        VALUES ($1, $2, $3, 'PENDING')
        RETURNING *
      `;
      const itemRes = await client.query(insertItem, [tenantId, permit.id, docName]);
      insertedChecklist.push(itemRes.rows[0]);
    }

    // 4. Record Audit Log
    const auditQuery = `
      INSERT INTO audit_logs (tenant_id, action, resource, resource_id, payload)
      VALUES ($1, 'CREATE_PERMIT_CASE', 'permits', $2, $3)
    `;
    await client.query(auditQuery, [
      tenantId,
      permit.id,
      JSON.stringify({ employeeId: input.employeeId, permitType: input.permitType, checklistSize: checklistTemplates.length })
    ]);

    return {
      ...permit,
      checklist: insertedChecklist
    };
  });
}

/**
 * Fetch all permit cases for a tenant
 */
export async function getPermitCases(tenantId: string) {
  const query = `
    SELECT p.*, e.first_name, e.last_name, e.email 
    FROM permits p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.tenant_id = $1
    ORDER BY p.expiry_date ASC
  `;
  return executeQuery(query, [tenantId]);
}

/**
 * Fetch detailed permit case, including employee details and checklist status
 */
export async function getPermitCaseDetails(tenantId: string, permitId: string) {
  const permitQuery = `
    SELECT p.*, e.first_name, e.last_name, e.email, e.phone
    FROM permits p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.id = $1 AND p.tenant_id = $2
  `;
  const permits = await executeQuery(permitQuery, [permitId, tenantId]);
  if (permits.length === 0) throw new Error('Permit case not found.');
  const permit = permits[0];

  const checklistQuery = `
    SELECT * FROM permit_checklist_items 
    WHERE permit_id = $1 AND tenant_id = $2
    ORDER BY created_at ASC
  `;
  const checklist = await executeQuery(checklistQuery, [permitId, tenantId]);

  return {
    ...permit,
    checklist
  };
}

/**
 * Update the upload/verification status of a checklist item
 */
export async function updateChecklistItem(
  tenantId: string,
  permitId: string,
  itemId: string,
  status: string,
  fileKey?: string
) {
  return executeTransaction(async (client) => {
    // Verify permit exists
    const checkPermit = `SELECT id FROM permits WHERE id = $1 AND tenant_id = $2`;
    const permitRes = await client.query(checkPermit, [permitId, tenantId]);
    if (permitRes.rows.length === 0) throw new Error('Permit case not found.');

    const fields: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [status, itemId, permitId, tenantId];

    if (fileKey !== undefined) {
      fields.push('file_key = $5');
      params.push(fileKey);
    }

    const query = `
      UPDATE permit_checklist_items
      SET ${fields.join(', ')}
      WHERE id = $2 AND permit_id = $3 AND tenant_id = $4
      RETURNING *
    `;

    const result = await client.query(query, params);
    if (result.rows.length === 0) throw new Error('Checklist item not found.');

    // Log update
    const auditQuery = `
      INSERT INTO audit_logs (tenant_id, action, resource, resource_id, payload)
      VALUES ($1, 'UPDATE_CHECKLIST_ITEM', 'permit_checklist_items', $2, $3)
    `;
    await client.query(auditQuery, [
      tenantId,
      itemId,
      JSON.stringify({ status, hasFileKey: !!fileKey })
    ]);

    return result.rows[0];
  });
}

/**
 * Background alert engine scanning database for permit expirations.
 * This runs across all tenants since it's a global platform cron job.
 */
export async function scanAndAlertPermitExpiries() {
  console.log('[Immigration Alerts] Initiating permit expiry check scan...');
  
  // We execute this with bypassRls set to true because the cron job runs globally without a specific request tenant context
  return executeTransaction(async (client) => {
    // Enable RLS bypass inside the transaction context
    await client.query("SET LOCAL app.bypass_rls = 'true'");

    const query = `
      SELECT p.id, p.tenant_id, p.permit_number, p.permit_type, p.expiry_date,
             p.alert_90_sent, p.alert_60_sent, p.alert_30_sent, p.alert_7_sent,
             e.first_name, e.last_name, e.email,
             (p.expiry_date - CURRENT_DATE) as days_remaining,
             t.name as tenant_name
      FROM permits p
      JOIN employees e ON p.employee_id = e.id
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.status = 'APPROVED'
        AND p.expiry_date >= CURRENT_DATE
        AND (
          (p.expiry_date - CURRENT_DATE <= 90 AND NOT p.alert_90_sent) OR
          (p.expiry_date - CURRENT_DATE <= 60 AND NOT p.alert_60_sent) OR
          (p.expiry_date - CURRENT_DATE <= 30 AND NOT p.alert_30_sent) OR
          (p.expiry_date - CURRENT_DATE <= 7 AND NOT p.alert_7_sent)
        )
    `;

    const scanRes = await client.query(query);
    const expiries = scanRes.rows;

    let emailsTriggeredCount = 0;

    for (const exp of expiries) {
      const days = Number(exp.days_remaining);
      let alertField = '';
      let alertLevel = 0;

      if (days <= 7 && !exp.alert_7_sent) {
        alertField = 'alert_7_sent';
        alertLevel = 7;
      } else if (days <= 30 && !exp.alert_30_sent) {
        alertField = 'alert_30_sent';
        alertLevel = 30;
      } else if (days <= 60 && !exp.alert_60_sent) {
        alertField = 'alert_60_sent';
        alertLevel = 60;
      } else if (days <= 90 && !exp.alert_90_sent) {
        alertField = 'alert_90_sent';
        alertLevel = 90;
      }

      if (alertField) {
        // Send simulated email
        console.log(`[ALERT EMAIL] 
          TO: ${exp.email} 
          SUBJECT: URGENT: Immigration Permit Expiring in ${days} days
          CONTENT: Dear ${exp.first_name} ${exp.last_name}, 
          Your immigration permit (${exp.permit_type} #${exp.permit_number}) registered under ${exp.tenant_name} is expiring on ${new Date(exp.expiry_date).toDateString()}. 
          Please submit renewal documents immediately.`
        );

        // Update database to note alert sent
        const updateAlert = `
          UPDATE permits 
          SET ${alertField} = TRUE, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `;
        await client.query(updateAlert, [exp.id]);

        // Insert audit log under the tenant's namespace
        const auditLogQuery = `
          INSERT INTO audit_logs (tenant_id, action, resource, resource_id, payload)
          VALUES ($1, $2, 'permits', $3, $4)
        `;
        await client.query(auditLogQuery, [
          exp.tenant_id,
          `EXPIRY_ALERT_SENT_${alertLevel}`,
          exp.id,
          JSON.stringify({ employeeName: `${exp.first_name} ${exp.last_name}`, daysRemaining: days })
        ]);

        emailsTriggeredCount++;
      }
    }

    console.log(`[Immigration Alerts] Completed scan. Emailed triggers: ${emailsTriggeredCount}`);
    return emailsTriggeredCount;
  });
}
