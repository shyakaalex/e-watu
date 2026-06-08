import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, fetchEmployee, updateEmployee } from '../../payrollApi';

const EMPLOYEE_TYPES = [
  { value: 'OUTSOURCED', label: 'Outsourced' },
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'SECONDED', label: 'Seconded' },
];

const GENDERS = [
  { value: '', label: 'Select gender…' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other / Prefer not to say' },
];

const NATIONALITIES = [
  { value: '', label: 'Select nationality…' },
  { value: 'Rwandan', label: 'Rwandan' },
  { value: 'Burundian', label: 'Burundian' },
  { value: 'Congolese', label: 'Congolese (DRC)' },
  { value: 'Kenyan', label: 'Kenyan' },
  { value: 'Ugandan', label: 'Ugandan' },
  { value: 'Tanzanian', label: 'Tanzanian' },
  { value: 'Other', label: 'Other' },
];

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeType: string;
  clientId: string;
  jobTitle: string;
  department: string;
  startDate: string;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  nationalId: string;
  bankAccount: string;
  bankName: string;
  bankBranch: string;
  gender: string;
  nationality: string;
  dateOfBirth: string;
};

const DEFAULT_FORM: Form = {
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
};

export function PayrollEmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchEmployee(id).then((employee: any) =>
      setForm((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(employee).map(([k, v]) => [k, String(v ?? '')])) }) as Form),
    );
  }, [id]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        basicSalary: Number(form.basicSalary || 0),
        housingAllowance: Number(form.housingAllowance || 0),
        transportAllowance: Number(form.transportAllowance || 0),
        otherAllowances: Number(form.otherAllowances || 0),
      };
      const result = id ? await updateEmployee(id, payload) : await createEmployee(payload as any);
      navigate(`/payroll/employees/${(result as any).id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rec-page">
      <h1 className="rec-page__title">{id ? 'Edit employee' : 'New employee'}</h1>

      <form className="rec-form" onSubmit={onSubmit}>

        {/* ── Personal info ── */}
        <div className="rec-form__section-title">Personal information</div>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            First name <span className="rec-form__req">*</span>
            <input className="auth-input" type="text" required value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
          </label>
          <label className="rec-form__label">
            Last name <span className="rec-form__req">*</span>
            <input className="auth-input" type="text" required value={form.lastName} onChange={set('lastName')} placeholder="Uwera" />
          </label>
          <label className="rec-form__label">
            Email
            <input className="auth-input" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.rw" />
          </label>
          <label className="rec-form__label">
            Phone
            <input className="auth-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+250 7xx xxx xxx" />
          </label>
          <label className="rec-form__label">
            Date of birth
            <input className="auth-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          </label>
          <label className="rec-form__label">
            Gender
            <select className="auth-input" value={form.gender} onChange={set('gender')}>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
          <label className="rec-form__label">
            Nationality
            <select className="auth-input" value={form.nationality} onChange={set('nationality')}>
              {NATIONALITIES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </label>
          <label className="rec-form__label">
            National ID <small className="rec-form__hint">(stored encrypted)</small>
            <input className="auth-input" type="text" value={form.nationalId} onChange={set('nationalId')} placeholder="1 19xx xxxxxxxx xx xx" />
          </label>
        </div>

        {/* ── Employment ── */}
        <div className="rec-form__section-title">Employment details</div>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Employee type <span className="rec-form__req">*</span>
            <select className="auth-input" required value={form.employeeType} onChange={set('employeeType')}>
              {EMPLOYEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="rec-form__label">
            Client ID
            <input className="auth-input" type="text" value={form.clientId} onChange={set('clientId')} placeholder="client-001" />
          </label>
          <label className="rec-form__label">
            Job title <span className="rec-form__req">*</span>
            <input className="auth-input" type="text" required value={form.jobTitle} onChange={set('jobTitle')} placeholder="Software Engineer" />
          </label>
          <label className="rec-form__label">
            Department
            <input className="auth-input" type="text" value={form.department} onChange={set('department')} placeholder="Engineering" />
          </label>
          <label className="rec-form__label">
            Start date <span className="rec-form__req">*</span>
            <input className="auth-input" type="date" required value={form.startDate} onChange={set('startDate')} />
          </label>
        </div>

        {/* ── Salary ── */}
        <div className="rec-form__section-title">Salary & allowances (RWF)</div>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Basic salary
            <input className="auth-input" type="number" min="0" step="1000" value={form.basicSalary} onChange={set('basicSalary')} />
          </label>
          <label className="rec-form__label">
            Housing allowance
            <input className="auth-input" type="number" min="0" step="1000" value={form.housingAllowance} onChange={set('housingAllowance')} />
          </label>
          <label className="rec-form__label">
            Transport allowance
            <input className="auth-input" type="number" min="0" step="1000" value={form.transportAllowance} onChange={set('transportAllowance')} />
          </label>
          <label className="rec-form__label">
            Other allowances
            <input className="auth-input" type="number" min="0" step="1000" value={form.otherAllowances} onChange={set('otherAllowances')} />
          </label>
        </div>

        {/* ── Bank ── */}
        <div className="rec-form__section-title">Bank details</div>
        <div className="rec-form__grid">
          <label className="rec-form__label">
            Bank name
            <input className="auth-input" type="text" value={form.bankName} onChange={set('bankName')} placeholder="Bank of Kigali" />
          </label>
          <label className="rec-form__label">
            Bank branch
            <input className="auth-input" type="text" value={form.bankBranch} onChange={set('bankBranch')} placeholder="Kigali City" />
          </label>
          <label className="rec-form__label rec-form__label--full">
            Account number <small className="rec-form__hint">(stored encrypted)</small>
            <input className="auth-input" type="text" value={form.bankAccount} onChange={set('bankAccount')} placeholder="000-XXXXXXXXX-00" />
          </label>
        </div>

        <div className="rec-form__actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : id ? 'Save changes' : 'Create employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
