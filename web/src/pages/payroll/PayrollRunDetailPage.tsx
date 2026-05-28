import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  approvePayrollStage,
  emailPayslips,
  fetchPayrollRun,
  lockPayrollRun,
  recalculatePayrollRun,
  rejectPayrollStage,
  submitPayrollRun,
  updatePayrollLine,
  type PayrollLine,
  type PayrollRun,
} from '../../payrollApi';

export function PayrollRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editGross, setEditGross] = useState('');
  const [editDeductions, setEditDeductions] = useState('');

  const load = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setErr(null);
    try {
      setRun(await fetchPayrollRun(runId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<PayrollRun>) => {
    setBusy(true);
    setErr(null);
    try {
      setRun(await fn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (line: PayrollLine) => {
    setEditingLineId(line.id);
    setEditGross(line.grossPay);
    setEditDeductions(line.deductions);
  };

  const saveLine = async () => {
    if (!run || !editingLineId) return;
    await act(() =>
      updatePayrollLine(run.id, editingLineId, {
        grossPay: Number(editGross),
        deductions: Number(editDeductions),
      }),
    );
    setEditingLineId(null);
  };

  if (loading) return <div className="rec-page"><p className="muted">Loading run…</p></div>;
  if (!run) return <div className="rec-page"><p className="alert alert--err">{err ?? 'Run not found'}</p></div>;

  const pendingStage = run.approvals?.find((a) => a.status === 'PENDING')?.stage;
  const editable = run.status === 'DRAFT';

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <p className="muted small"><Link to="/payroll/runs">Runs</Link> / {run.periodYear}-{String(run.periodMonth).padStart(2, '0')}</p>
          <h1 className="rec-page__title">Payroll run</h1>
          <p className="rec-page__sub">Status: {run.status}</p>
        </div>
        <div className="rec-page__actions">
          {editable && (
            <button className="btn btn--ghost" disabled={busy} onClick={() => act(() => recalculatePayrollRun(run.id))}>
              Recalculate
            </button>
          )}
          {run.status === 'DRAFT' && (
            <button className="btn btn--primary" disabled={busy} onClick={() => act(() => submitPayrollRun(run.id))}>Submit for approval</button>
          )}
          {run.status === 'IN_REVIEW' && pendingStage && (
            <>
              <button className="btn btn--primary" disabled={busy} onClick={() => act(() => approvePayrollStage(run.id, pendingStage))}>Approve {pendingStage}</button>
              <button className="btn btn--ghost" disabled={busy} onClick={() => act(() => rejectPayrollStage(run.id, pendingStage))}>Reject</button>
            </>
          )}
          {run.status === 'APPROVED' && (
            <button className="btn btn--primary" disabled={busy} onClick={() => act(() => lockPayrollRun(run.id))}>Lock run</button>
          )}
          {run.status === 'LOCKED' && (
            <button
              className="btn btn--ghost"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setErr(null);
                try {
                  const result = await emailPayslips(run.id);
                  setErr(null);
                  alert(`Emailed ${result.emailedCount} payslip(s)`);
                } catch (e) {
                  setErr(e instanceof Error ? e.message : String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Email payslips
            </button>
          )}
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="rec-table-wrap">
        <table className="rec-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net</th>
              {editable && <th />}
            </tr>
          </thead>
          <tbody>
            {(run.payrollLines ?? []).map((line) => (
              <tr key={line.id}>
                <td>
                  {line.employee
                    ? `${line.employee.firstName} ${line.employee.lastName}`
                    : line.employeeId}
                </td>
                {editingLineId === line.id ? (
                  <>
                    <td><input className="auth-input" type="number" min={0} step="0.01" value={editGross} onChange={(e) => setEditGross(e.target.value)} /></td>
                    <td><input className="auth-input" type="number" min={0} step="0.01" value={editDeductions} onChange={(e) => setEditDeductions(e.target.value)} /></td>
                    <td>{Math.max(0, Number(editGross) - Number(editDeductions)).toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn--primary small" disabled={busy} onClick={saveLine}>Save</button>{' '}
                      <button type="button" className="btn btn--ghost small" onClick={() => setEditingLineId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{line.grossPay}</td>
                    <td>{line.deductions}</td>
                    <td>{line.netPay}</td>
                    {editable && (
                      <td>
                        <button type="button" className="btn btn--ghost small" onClick={() => startEdit(line)}>Edit</button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {run.approvals && run.approvals.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 className="rec-form-card__title">Approval chain</h2>
          <ul>
            {run.approvals.map((a) => (
              <li key={a.id}>{a.stage}: {a.status}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
