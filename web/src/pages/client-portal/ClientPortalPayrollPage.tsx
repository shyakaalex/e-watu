import { useEffect, useState } from 'react';
import { approvePayroll, fetchPeriodPayslips, fetchPeriods, rejectPayroll } from '../../payrollApi';

export function ClientPortalPayrollPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payslips, setPayslips] = useState<any[]>([]);

  const load = async () => {
    const data = (await fetchPeriods({ status: 'MD_APPROVED' })) as any[];
    setPeriods(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">Client Payroll Approvals</h1>
      <div className="rec-table-wrap">
        <table className="rec-table">
          <thead><tr><th>Client</th><th>Period</th><th>Status</th><th /></tr></thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <td>{period.clientId}</td>
                <td>{period.periodMonth}/{period.periodYear}</td>
                <td>{period.status}</td>
                <td><button className="btn btn--ghost small" onClick={() => setSelected(period)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <h2 className="rec-form-card__title">Period {selected.periodMonth}/{selected.periodYear}</h2>
          <button className="btn btn--primary" onClick={async () => { await approvePayroll(selected.id, {}); await load(); }}>Approve</button>
          <input className="auth-input" placeholder="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <button className="btn btn--ghost" onClick={async () => { await rejectPayroll(selected.id, rejectReason); setRejectReason(''); await load(); }}>Reject</button>
          <button className="btn btn--ghost" onClick={async () => setPayslips((await fetchPeriodPayslips(selected.id)) as any[])}>Load payslips</button>
          <ul>{payslips.map((p) => <li key={p.id}>{p.employeeName}: {p.netPay}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
