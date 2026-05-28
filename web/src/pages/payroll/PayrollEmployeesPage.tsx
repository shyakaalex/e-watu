import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, type Employee } from '../../payrollApi';

export function PayrollEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [employeeType, setEmployeeType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [clientId, setClientId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await fetchEmployees({
        employeeType: employeeType === 'ALL' ? undefined : employeeType,
        employmentStatus: status === 'ALL' ? undefined : status,
        clientId: clientId || undefined,
        search: search || undefined,
      });
      setEmployees(Array.isArray(result) ? result : result.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [employeeType, status, clientId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const countLabel = useMemo(() => `${employees.length} employee${employees.length !== 1 ? 's' : ''}`, [employees]);

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Employees</h1>
          <p className="rec-page__sub">{countLabel}</p>
        </div>
        <button className="btn btn--primary" onClick={() => navigate('/payroll/employees/new')}>
          + Add employee
        </button>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="card rec-form-card">
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Employee type
            <select className="auth-input" value={employeeType} onChange={(e) => setEmployeeType(e.target.value)}>
              <option value="ALL">ALL</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="OUTSOURCED">OUTSOURCED</option>
              <option value="SECONDED">SECONDED</option>
            </select>
          </label>
          <label className="rec-form__label">
            Status
            <select className="auth-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">ALL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label className="rec-form__label">
            Client ID
            <input className="auth-input" value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </label>
          <label className="rec-form__label">
            Search
            <input
              className="auth-input"
              placeholder="Name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading employees…</p>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Client</th>
                <th>Job title</th>
                <th>Start date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} onClick={() => navigate(`/payroll/employees/${e.id}`)} style={{ cursor: 'pointer' }}>
                  <td>{e.firstName} {e.lastName}</td>
                  <td>{(e as any).employeeType ?? 'OUTSOURCED'}</td>
                  <td>{(e as any).clientId ?? '-'}</td>
                  <td>{(e as any).jobTitle ?? '-'}</td>
                  <td>{(e as any).startDate?.slice(0, 10) ?? '-'}</td>
                  <td>{(e as any).employmentStatus ?? (e as any).status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
