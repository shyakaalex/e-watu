import { useEffect, useState } from 'react';
import { fetchLeaveTypes, type LeaveType } from '../../payrollApi';

export function LeaveTypesPage() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveTypes()
      .then(setTypes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rec-page" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="muted">Loading leave categories…</p>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <div className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Leave Types & Policy Configuration</h1>
          <p className="muted">Configured leave categories, codes, and annual default day allocations.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {types.map((t) => (
          <div className="card" key={t.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{t.name}</h3>
                <span className="badge badge--gray">{t.code}</span>
              </div>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                {t.description || 'Standard statutory leave policy for company employees.'}
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Default Allocation:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent, #0284c7)' }}>{t.defaultDays} Days / Year</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
