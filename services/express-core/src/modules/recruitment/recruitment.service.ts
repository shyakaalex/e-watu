import { executeQuery, executeTransaction } from '../../db/client';

export interface JobOrderInput {
  clientId: string;
  title: string;
  description?: string;
  feePercentage?: number;
}

export interface ApplicationInput {
  jobOrderId: string;
  candidateId: string;
  notes?: string;
}

/**
 * Job Orders CRUD
 */
export async function createJobOrder(tenantId: string, input: JobOrderInput) {
  const query = `
    INSERT INTO job_orders (tenant_id, client_id, title, description, fee_percentage, status)
    VALUES ($1, $2, $3, $4, $5, 'OPEN')
    RETURNING *
  `;
  const res = await executeQuery(query, [
    tenantId,
    input.clientId,
    input.title,
    input.description || null,
    input.feePercentage !== undefined ? input.feePercentage : 15.00
  ]);
  return res[0];
}

export async function getJobOrders(tenantId: string) {
  const query = `SELECT * FROM job_orders WHERE tenant_id = $1 ORDER BY created_at DESC`;
  return executeQuery(query, [tenantId]);
}

export async function getJobOrder(tenantId: string, id: string) {
  const query = `SELECT * FROM job_orders WHERE id = $1 AND tenant_id = $2`;
  const res = await executeQuery(query, [id, tenantId]);
  if (res.length === 0) throw new Error('Job order not found.');
  return res[0];
}

export async function updateJobOrder(tenantId: string, id: string, data: Partial<JobOrderInput> & { status?: string }) {
  const fields: string[] = [];
  const params: any[] = [id, tenantId];
  let idx = 3;

  if (data.clientId !== undefined) {
    fields.push(`client_id = $${idx++}`);
    params.push(data.clientId);
  }
  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    params.push(data.description);
  }
  if (data.feePercentage !== undefined) {
    fields.push(`fee_percentage = $${idx++}`);
    params.push(data.feePercentage);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    params.push(data.status);
  }

  if (fields.length === 0) {
    return getJobOrder(tenantId, id);
  }

  const query = `
    UPDATE job_orders
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const res = await executeQuery(query, params);
  if (res.length === 0) throw new Error('Job order not found.');
  return res[0];
}

export async function deleteJobOrder(tenantId: string, id: string) {
  const query = `DELETE FROM job_orders WHERE id = $1 AND tenant_id = $2 RETURNING id`;
  const res = await executeQuery(query, [id, tenantId]);
  if (res.length === 0) throw new Error('Job order not found.');
  return res[0];
}

/**
 * Applications CRUD
 */
export async function createApplication(tenantId: string, input: ApplicationInput) {
  // Validate candidate unique application for this job
  const checkQuery = `
    SELECT id FROM applications 
    WHERE tenant_id = $1 AND job_order_id = $2 AND candidate_id = $3
  `;
  const existing = await executeQuery(checkQuery, [tenantId, input.jobOrderId, input.candidateId]);
  if (existing.length > 0) {
    throw new Error('This candidate has already applied for this job.');
  }

  const query = `
    INSERT INTO applications (tenant_id, job_order_id, candidate_id, stage, notes)
    VALUES ($1, $2, $3, 'Applied', $4)
    RETURNING *
  `;
  const res = await executeQuery(query, [
    tenantId,
    input.jobOrderId,
    input.candidateId,
    input.notes || null
  ]);
  return res[0];
}

export async function getApplications(tenantId: string, filters: { jobOrderId?: string; candidateId?: string } = {}) {
  let query = `
    SELECT a.*, c.first_name, c.last_name, c.email, j.title as job_title 
    FROM applications a
    JOIN candidates c ON a.candidate_id = c.id
    JOIN job_orders j ON a.job_order_id = j.id
    WHERE a.tenant_id = $1
  `;
  const params: any[] = [tenantId];
  let idx = 2;

  if (filters.jobOrderId) {
    query += ` AND a.job_order_id = $${idx++}`;
    params.push(filters.jobOrderId);
  }
  if (filters.candidateId) {
    query += ` AND a.candidate_id = $${idx++}`;
    params.push(filters.candidateId);
  }

  query += ` ORDER BY a.created_at DESC`;
  return executeQuery(query, params);
}

export async function getApplication(tenantId: string, id: string) {
  const query = `
    SELECT a.*, c.first_name, c.last_name, c.email, j.title as job_title, j.client_id, j.fee_percentage 
    FROM applications a
    JOIN candidates c ON a.candidate_id = c.id
    JOIN job_orders j ON a.job_order_id = j.id
    WHERE a.id = $1 AND a.tenant_id = $2
  `;
  const res = await executeQuery(query, [id, tenantId]);
  if (res.length === 0) throw new Error('Application not found.');
  return res[0];
}

/**
 * Pipeline Stage Transition Service
 */
export async function updateApplicationStage(
  tenantId: string,
  applicationId: string,
  newStage: string,
  userId: string,
  options: { basicSalary?: number; notes?: string } = {}
) {
  const validStages = ['Applied', 'Screened', 'Shortlisted', 'Interviewed', 'Offered', 'Placed'];
  if (!validStages.includes(newStage)) {
    throw new Error(`Invalid recruitment pipeline stage: ${newStage}`);
  }

  return executeTransaction(async (client) => {
    // 1. Fetch current application details
    const appQuery = `
      SELECT a.id, a.stage, a.candidate_id, a.job_order_id, 
             c.first_name, c.last_name, c.email, c.phone, 
             j.client_id, j.title as job_title, j.fee_percentage
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN job_orders j ON a.job_order_id = j.id
      WHERE a.id = $1 AND a.tenant_id = $2
    `;
    const appRes = await client.query(appQuery, [applicationId, tenantId]);
    if (appRes.rows.length === 0) {
      throw new Error('Application not found.');
    }
    const app = appRes.rows[0];

    // 2. Perform status transition
    const updateAppQuery = `
      UPDATE applications
      SET stage = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;
    await client.query(updateAppQuery, [newStage, options.notes || null, applicationId, tenantId]);

    // 3. Logic for 'Placed' stage
    if (newStage === 'Placed' && app.stage !== 'Placed') {
      const basicSalary = options.basicSalary || 1500000.00; // Default placement base salary if not provided (e.g. 1.5M RWF)
      
      // A. Candidate to Employee promotion
      // Ensure the employee is not already created
      const checkEmp = `SELECT id FROM employees WHERE tenant_id = $1 AND candidate_id = $2`;
      const empRes = await client.query(checkEmp, [tenantId, app.candidate_id]);
      
      let employeeId = null;
      if (empRes.rows.length === 0) {
        const createEmpQuery = `
          INSERT INTO employees (
            tenant_id, client_id, candidate_id, first_name, last_name, email, phone, basic_salary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        const newEmpRes = await client.query(createEmpQuery, [
          tenantId,
          app.client_id,
          app.candidate_id,
          app.first_name,
          app.last_name,
          app.email,
          app.phone,
          basicSalary
        ]);
        employeeId = newEmpRes.rows[0].id;
      } else {
        employeeId = empRes.rows[0].id;
      }

      // B. Generate Draft Placement Invoice
      const feePercent = app.fee_percentage ? Number(app.fee_percentage) : 15.00;
      const invoiceAmount = basicSalary * 12 * (feePercent / 100); // 15% (or job fee %) of annual gross salary

      const description = `Placement fee for ${app.first_name} ${app.last_name} in position of ${app.job_title}`;

      const createInvoiceQuery = `
        INSERT INTO invoices (
          tenant_id, client_id, job_order_id, candidate_id, amount, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6)
        RETURNING id
      `;
      const invRes = await client.query(createInvoiceQuery, [
        tenantId,
        app.client_id,
        app.job_order_id,
        app.candidate_id,
        invoiceAmount,
        description
      ]);

      // C. Audit Log the event
      const logPayload = JSON.stringify({
        candidateId: app.candidate_id,
        employeeId,
        invoiceId: invRes.rows[0].id,
        amount: invoiceAmount,
        salary: basicSalary
      });
      const insertAudit = `
        INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, payload)
        VALUES ($1, $2, 'CANDIDATE_PLACED_PROMOTED', 'applications', $3, $4)
      `;
      await client.query(insertAudit, [tenantId, userId, applicationId, logPayload]);
    } else {
      // Audit log generic stage transition
      const logPayload = JSON.stringify({ from: app.stage, to: newStage, notes: options.notes });
      const insertAudit = `
        INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, payload)
        VALUES ($1, $2, 'APPLICATION_STAGE_TRANSITION', 'applications', $3, $4)
      `;
      await client.query(insertAudit, [tenantId, userId, applicationId, logPayload]);
    }

    return { applicationId, stage: newStage };
  });
}
