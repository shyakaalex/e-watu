import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMe } from '../../api';
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

function hasRole(roles: string[], role: string): boolean {
  return roles.includes(role);
}

export function PayrollPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setPeriod(await fetchPeriod(id));
  }, [id]);

  useEffect(() => {
    load();
    fetchMe().then((me) => setRoles(me.roles)).catch(() => setRoles([]));
  }, [load]);

  if (!period) return <div className="rec-page"><p className="muted">Loading period...</p></div>;

  const status = period.status as string;
  const canRun = status === 'DRAFT' && (hasRole(roles, 'FINANCE_OFFICER') || hasRole(roles, 'TENANT_ADMIN'));
  const canSubmit = status === 'DRAFT' && (hasRole(roles, 'FINANCE_OFFICER') || hasRole(roles, 'TENANT_ADMIN')) && (period.records?.length ?? 0) > 0;
  const canHrApprove = status === 'SUBMITTED' && hasRole(roles, 'HR_MANAGER');
  const canMdApprove = status === 'HR_APPROVED' && hasRole(roles, 'TENANT_ADMIN');
  const canClientApprove = status === 'MD_APPROVED' && hasRole(roles, 'CLIENT_ADMIN');
  const canFinalize = status === 'CLIENT_APPROVED' && (hasRole(roles, 'FINANCE_OFFICER') || hasRole(roles, 'TENANT_ADMIN'));
  const canReject =
    (status === 'SUBMITTED' && hasRole(roles, 'HR_MANAGER')) ||
    (status === 'HR_APPROVED' && hasRole(roles, 'TENANT_ADMIN')) ||
    (status === 'MD_APPROVED' && hasRole(roles, 'CLIENT_ADMIN')) ||
    (status === 'CLIENT_APPROVED' && hasRole(roles, 'FINANCE_OFFICER'));

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectPayroll(period.id, rejectReason);
    setRejectReason('');
    setShowRejectModal(false);
    await load();
  };

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Period {period.periodMonth}/{period.periodYear}</h1>
      <p>Client ID: {period.clientId}</p>
      <p>Status: {period.status}</p>
      <div className="rec-page__actions">
        {canRun && (
          <button className="btn btn--ghost" onClick={async () => { await runPayroll(period.id); await load(); }}>
            Run Payroll
          </button>
        )}
        {canSubmit && (
          <button className="btn btn--primary" onClick={async () => { await submitPayroll(period.id); await load(); }}>
            Submit for Approval
          </button>
        )}
        {canHrApprove && (
          <button className="btn btn--primary" onClick={async () => { await approvePayroll(period.id, {}); await load(); }}>
            HR Approve
          </button>
        )}
        {canMdApprove && (
          <button className="btn btn--primary" onClick={async () => { await approvePayroll(period.id, {}); await load(); }}>
            MD Approve
          </button>
        )}
        {canClientApprove && (
          <button className="btn btn--primary" onClick={async () => { await approvePayroll(period.id, {}); await load(); }}>
            Client Approve
          </button>
        )}
        {canFinalize && (
          <button className="btn btn--primary" onClick={async () => { await finalizePayroll(period.id); await load(); }}>
            Finalize Payroll
          </button>
        )}
        {canReject && (
          <button className="btn btn--ghost" onClick={() => setShowRejectModal(true)}>Reject</button>
        )}
      </div>

      {showRejectModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRejectModal(false)}
        >
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '400px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem' }}>Reject payroll period</h3>
            <label className="rec-form__label">
              Rejection reason <span className="rec-form__req">*</span>
              <textarea
                className="auth-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this period is being rejected…"
              />
            </label>
            <div className="rec-form__actions" style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn--danger" disabled={!rejectReason.trim()} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

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
          <button className="btn btn--ghost" onClick={async () => {
            const slips = await fetchPeriodPayslips(period.id);
            slips.forEach((s: any) => { if (s.downloadUrl) window.open(s.downloadUrl, '_blank'); });
          }}>Download Payslips</button>
        </div>
      )}
    </div>
  );
}
