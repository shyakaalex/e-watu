import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchContracts,
  fetchEmployee,
  fetchEmployeePayslips,
  terminateEmployee,
  uploadContractFile,
  type Employee,
} from '../../payrollApi';

export function PayrollEmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [tab, setTab] = useState<'profile' | 'contracts' | 'payslips'>('profile');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setErr(null);
    try {
      const [emp, contractData, payslipData] = await Promise.all([
        fetchEmployee(employeeId),
        fetchContracts(employeeId),
        fetchEmployeePayslips(employeeId),
      ]);
      setEmployee(emp);
      setContracts(contractData);
      setPayslips(payslipData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="rec-page"><p className="muted">Loading employee…</p></div>;
  if (!employee) return <div className="rec-page"><p className="alert alert--err">{err ?? 'Employee not found'}</p></div>;

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <p className="muted small"><Link to="/payroll/employees">Employees</Link> / {employee.firstName} {employee.lastName}</p>
          <h1 className="rec-page__title">{employee.firstName} {employee.lastName}</h1>
          <p className="rec-page__sub">{(employee as any).employmentStatus ?? (employee as any).status}</p>
        </div>
        <div className="rec-page__actions">
          <button className="btn btn--ghost" onClick={() => navigate(`/payroll/employees/${employee.id}/edit`)}>Edit</button>
          <button className="btn btn--danger" onClick={async () => {
            if (!confirm('Terminate this employee?')) return;
            await terminateEmployee(employee.id);
            await load();
          }}>Terminate</button>
        </div>
      </div>

      {err && <div className="alert alert--err">{err}</div>}

      <div className="rec-page__actions" style={{ marginBottom: '0.75rem' }}>
        <button className={`btn ${tab === 'profile' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setTab('profile')}>Profile</button>
        <button className={`btn ${tab === 'contracts' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setTab('contracts')}>Contracts</button>
        <button className={`btn ${tab === 'payslips' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setTab('payslips')}>Payslips</button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <h2 className="rec-form-card__title">Personal Info</h2>
          <p>Email: {(employee as any).email ?? '-'}</p>
          <p>Phone: {(employee as any).phone ?? '-'}</p>
          <p>Date of birth: {(employee as any).dateOfBirth?.slice(0, 10) ?? '-'}</p>
          <p>Gender: {(employee as any).gender ?? '-'}</p>
          <p>Nationality: {(employee as any).nationality ?? '-'}</p>
          <h3>Job Info</h3>
          <p>Department: {(employee as any).department ?? '-'}</p>
          <p>Job title: {(employee as any).jobTitle ?? '-'}</p>
          <p>Employee type: {(employee as any).employeeType ?? '-'}</p>
          <p>Start date: {(employee as any).startDate?.slice(0, 10) ?? '-'}</p>
          <p>End date: {(employee as any).endDate?.slice(0, 10) ?? '-'}</p>
          <p>Status: {(employee as any).employmentStatus ?? '-'}</p>
          <h3>Salary</h3>
          <p>Basic salary: {(employee as any).basicSalary ?? '-'}</p>
          <p>Housing allowance: {(employee as any).housingAllowance ?? '-'}</p>
          <p>Transport allowance: {(employee as any).transportAllowance ?? '-'}</p>
          <p>Other allowances: {(employee as any).otherAllowances ?? '-'}</p>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="card">
          <h2 className="rec-form-card__title">Contracts</h2>
          <table className="rec-table">
            <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Salary</th><th>Status</th><th>Upload</th></tr></thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.contractType}</td>
                  <td>{contract.startDate?.slice(0, 10)}</td>
                  <td>{contract.endDate?.slice(0, 10) ?? '-'}</td>
                  <td>{contract.salary}</td>
                  <td>{contract.status}</td>
                  <td><button className="btn btn--ghost small" onClick={() => uploadContractFile(contract.id, 'manual-upload')}>Upload</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payslips' && (
        <div className="card">
          <h2 className="rec-form-card__title">Payslips</h2>
          <ul>
            {payslips.map((p) => (
              <li key={p.id}>
                {p.periodMonth}/{p.periodYear} - {p.netPay}{' '}
                <button className="btn btn--ghost small" onClick={() => alert(p.payslipText)}>
                  View payslip
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
