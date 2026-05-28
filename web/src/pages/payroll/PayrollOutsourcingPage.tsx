import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createOutsourcingAssignment,
  fetchEmployees,
  fetchOutsourcingAssignments,
  type Employee,
  type OutsourcingAssignment,
} from '../../payrollApi';

export function PayrollOutsourcingPage() {
  const [items, setItems] = useState<OutsourcingAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [clientName, setClientName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [assignments, emps] = await Promise.all([
        fetchOutsourcingAssignments(),
        fetchEmployees(),
      ]);
      setItems(assignments);
      setEmployees(emps);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createOutsourcingAssignment({
        employeeId,
        clientName: clientName.trim(),
        roleName: roleName.trim(),
        startDate,
        monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Outsourcing assignments</h1>
          <p className="rec-page__sub">{items.length} assignment{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New assignment'}
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      {showForm && (
        <div className="card rec-form-card">
          <form className="rec-form" onSubmit={onSubmit}>
            <div className="rec-form__grid">
              <label className="rec-form__label rec-form__label--full">
                Employee
                <select className="auth-input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </label>
              <label className="rec-form__label">Client *<input className="auth-input" value={clientName} onChange={(e) => setClientName(e.target.value)} required /></label>
              <label className="rec-form__label">Role *<input className="auth-input" value={roleName} onChange={(e) => setRoleName(e.target.value)} required /></label>
              <label className="rec-form__label">Start date *<input className="auth-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
              <label className="rec-form__label">Monthly fee<input className="auth-input" type="number" min={0} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} /></label>
            </div>
            <div className="rec-form__actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Role</th>
                <th>Start</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.clientName}</td>
                  <td>{item.roleName}</td>
                  <td>{item.startDate.slice(0, 10)}</td>
                  <td>{item.monthlyFee ?? '—'} {item.currency ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
