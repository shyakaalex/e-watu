import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  approvePayroll,
  downloadBankFile,
  downloadPAYEReport,
  downloadRSSBReport,
  fetchPeriod,
  fetchPeriodPayslips,
  finalizePayroll,
  rejectPayroll,
  runPayroll,
  submitPayroll,
} from '../../payrollApi';

export function PayrollPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setPeriod(await fetchPeriod(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!period) return <div className="rec-page"><p className="muted">Loading period...</p></div>;

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Period {period.periodMonth}/{period.periodYear}</h1>
      <p>Client ID: {period.clientId}</p>
      <p>Status: {period.status}</p>
      <div className="rec-page__actions">
        {period.status === 'DRAFT' && <button className="btn btn--ghost" onClick={async () => { await runPayroll(period.id); await load(); }}>Run Payroll</button>}
        {period.status === 'DRAFT' && (period.records?.length ?? 0) > 0 && <button className="btn btn--primary" onClick={async () => { await submitPayroll(period.id); await load(); }}>Submit for Approval</button>}
        {['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED'].includes(period.status) && <button className="btn btn--primary" onClick={async () => { await approvePayroll(period.id, {}); await load(); }}>Approve</button>}
        {['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED', 'CLIENT_APPROVED'].includes(period.status) && (
          <>
            <input className="auth-input" placeholder="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <button className="btn btn--ghost" onClick={async () => { await rejectPayroll(period.id, rejectReason); setRejectReason(''); await load(); }}>Reject</button>
          </>
        )}
        {period.status === 'CLIENT_APPROVED' && <button className="btn btn--primary" onClick={async () => { await finalizePayroll(period.id); await load(); }}>Finalize</button>}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="rec-form-card__title">Totals</h2>
        <p>Total Gross: {period.totals?.gross ?? 0}</p>
        <p>Total Deductions: {period.totals?.deductions ?? 0}</p>
        <p>Total Net Pay: {period.totals?.net ?? 0}</p>
        <p>Employee Count: {period.records?.length ?? 0}</p>
      </div>

      <div className="rec-table-wrap">
        <table className="rec-table">
          <thead><tr><th>Employee Name</th><th>Basic Salary</th><th>Gross Pay</th><th>PAYE</th><th>RSSB Employee</th><th>RSSB Medical</th><th>CBHI</th><th>Net Pay</th></tr></thead>
          <tbody>
            {(period.records ?? []).map((record: any) => (
              <tr key={record.id}>
                <td>{record.employee?.firstName} {record.employee?.lastName}</td>
                <td>{record.basicSalary}</td><td>{record.grossPay}</td><td>{record.paye}</td><td>{record.rssbEmployee}</td><td>{record.rssbMedical}</td><td>{record.cbhi}</td><td>{record.netPay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {period.status === 'FINALIZED' && (
        <div className="rec-page__actions">
          <button className="btn btn--ghost" onClick={() => downloadPAYEReport(period.id)}>Download PAYE Report</button>
          <button className="btn btn--ghost" onClick={() => downloadRSSBReport(period.id)}>Download RSSB Report</button>
          <button className="btn btn--ghost" onClick={() => downloadBankFile(period.id)}>Download Bank File</button>
          <button className="btn btn--ghost" onClick={async () => alert(JSON.stringify(await fetchPeriodPayslips(period.id), null, 2))}>View Payslips</button>
        </div>
      )}
    </div>
  );
}
