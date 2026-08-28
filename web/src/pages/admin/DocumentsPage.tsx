import { useCallback, useEffect, useState } from 'react';
import { fetchEmployeeDocumentCatalog, type DocumentCatalogEntry } from '../../payrollApi';
import { fetchCandidateDocumentCatalog } from '../../recruitmentApi';
import { parseApiError } from '../../lib/parseApiError';

const CATEGORY_BADGE: Record<string, string> = {
  'Employee Document': 'badge--blue',
  'Employment Contract': 'badge--teal',
  'Candidate Document': 'badge--orange',
};

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const load = useCallback(async (q: string) => {
    setError(null);
    setLoading(true);
    try {
      // The two sources have different role gates (HR/admin vs. HR/admin/recruiter), so a
      // caller lacking one side's permission (e.g. MANAGING_DIRECTOR isn't a RECRUITER)
      // should still see the other side rather than the whole page failing.
      const [employeeResult, candidateResult] = await Promise.allSettled([
        fetchEmployeeDocumentCatalog(q || undefined),
        fetchCandidateDocumentCatalog(q || undefined),
      ]);
      const employeeDocs = employeeResult.status === 'fulfilled' ? employeeResult.value : [];
      const candidateDocs = candidateResult.status === 'fulfilled' ? candidateResult.value : [];
      if (employeeResult.status === 'rejected' && candidateResult.status === 'rejected') {
        throw employeeResult.reason;
      }
      const merged = [...employeeDocs, ...candidateDocs].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      );
      setDocuments(merged);
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
  }, [search, load]);

  const categories = ['ALL', ...Array.from(new Set(documents.map((d) => d.category)))];
  const visible = category === 'ALL' ? documents : documents.filter((d) => d.category === category);

  return (
    <div className="adm-page">
      <header className="adm-page__head">
        <h1 className="adm-page__title">Documents</h1>
        <p className="adm-page__lead">
          A single view across employee documents, employment contracts, and candidate files.
        </p>
      </header>

      {error && <div className="alert alert--err">{error}</div>}

      <div className="adm-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="auth-input"
            style={{ flex: '1 1 240px' }}
            placeholder="Search by document name or person…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="auth-input" style={{ flex: '0 0 200px' }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="muted small">No documents found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Person</th>
                <th>Uploaded</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={`${d.category}-${d.id}`}>
                  <td>{d.name}</td>
                  <td><span className={`badge ${CATEGORY_BADGE[d.category] ?? 'badge--gray'}`}>{d.category}</span></td>
                  <td>{d.subjectName}</td>
                  <td className="muted">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                  <td className="muted">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</td>
                  <td>
                    {d.downloadUrl ? (
                      <a className="btn btn--ghost" href={d.downloadUrl} target="_blank" rel="noreferrer">Download</a>
                    ) : (
                      <span className="muted small">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
