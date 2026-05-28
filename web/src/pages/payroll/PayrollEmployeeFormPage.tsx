import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, fetchEmployee, updateEmployee } from '../../payrollApi';

export function PayrollEmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeType: 'OUTSOURCED',
    clientId: '',
    jobTitle: '',
    department: '',
    startDate: '',
    basicSalary: '0',
    housingAllowance: '0',
    transportAllowance: '0',
    otherAllowances: '0',
    nationalId: '',
    bankAccount: '',
    bankName: '',
    bankBranch: '',
    gender: '',
    nationality: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (!id) return;
    fetchEmployee(id).then((employee: any) =>
      setForm((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(employee).map(([k, v]) => [k, String(v ?? '')])) })),
    );
  }, [id]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      basicSalary: Number(form.basicSalary || 0),
      housingAllowance: Number(form.housingAllowance || 0),
      transportAllowance: Number(form.transportAllowance || 0),
      otherAllowances: Number(form.otherAllowances || 0),
    };
    const result = id ? await updateEmployee(id, payload) : await createEmployee(payload as any);
    navigate(`/payroll/employees/${(result as any).id}`);
  };

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">{id ? 'Edit employee' : 'New employee'}</h1>
      <form className="rec-form" onSubmit={onSubmit}>
        <div className="rec-form__grid">
          {Object.keys(form).map((key) => (
            <label className="rec-form__label" key={key}>
              {key === 'nationalId' ? 'nationalId (Stored securely encrypted)' : key === 'bankAccount' ? 'bankAccount (Stored securely encrypted)' : key}
              <input
                className="auth-input"
                type={key.toLowerCase().includes('date') ? 'date' : key.toLowerCase().includes('salary') || key.toLowerCase().includes('allowance') ? 'number' : 'text'}
                value={form[key]}
                onChange={(ev) => setForm((prev) => ({ ...prev, [key]: ev.target.value }))}
              />
            </label>
          ))}
        </div>
        <button className="btn btn--primary" type="submit">{id ? 'Save changes' : 'Create employee'}</button>
      </form>
    </div>
  );
}
