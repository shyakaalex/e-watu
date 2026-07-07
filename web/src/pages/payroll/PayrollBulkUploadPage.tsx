import { type FormEvent, useRef, useState } from 'react';
import { bulkImportEmployees, type EmployeeBulkImportResult, type EmployeeBulkImportRow } from '../../payrollApi';

type CsvRow = EmployeeBulkImportRow;

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'email', 'jobTitle', 'startDate'];
const OPTIONAL_COLUMNS = ['phone', 'department', 'clientId', 'basicSalary'];

function parseCsv(text: string): { rows: CsvRow[]; skippedLines: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], skippedLines: 0 };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: CsvRow[] = [];
  let skippedLines = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ''; });

    if (!obj.firstName || !obj.lastName || !obj.email || !obj.jobTitle || !obj.startDate) {
      skippedLines++;
      continue;
    }

    rows.push({
      firstName: obj.firstName,
      lastName: obj.lastName,
      email: obj.email,
      jobTitle: obj.jobTitle,
      startDate: obj.startDate,
      phone: obj.phone || undefined,
      department: obj.department || undefined,
      clientId: obj.clientId || undefined,
      basicSalary: obj.basicSalary ? Number(obj.basicSalary) : undefined,
    });
  }

  return { rows, skippedLines };
}

function downloadTemplate() {
  const header = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(',');
  const sample = 'Jane,Uwase,jane.uwase@example.com,HR Officer,2026-01-15,0788123456,Human Resources,,350000';
  const blob = new Blob([`${header}\n${sample}\n`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee-bulk-upload-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function PayrollBulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [skippedLines, setSkippedLines] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeBulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileSelected = async (f: File | null) => {
    setFile(f);
    setResult(null);
    setErr(null);
    setPreview(null);
    if (!f) return;
    try {
      const text = await f.text();
      const { rows, skippedLines: skipped } = parseCsv(text);
      setSkippedLines(skipped);
      if (rows.length === 0) {
        setErr('No valid rows found. Make sure the CSV has firstName, lastName, email, jobTitle and startDate columns.');
        return;
      }
      setPreview(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onImport = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!preview || preview.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await bulkImportEmployees(preview);
      setResult(res);
      setPreview(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setErr(null);
    setSkippedLines(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rec-page">
      <header className="rec-page__header">
        <div>
          <h1 className="rec-page__title">Bulk Upload</h1>
          <p className="rec-page__sub">Import employees in bulk from a CSV file.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={downloadTemplate}>
          Download CSV template
        </button>
      </header>

      <div className="rec-card" style={{ maxWidth: 640 }}>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Required columns: <strong>firstName</strong>, <strong>lastName</strong>, <strong>email</strong>,{' '}
          <strong>jobTitle</strong>, <strong>startDate</strong> (YYYY-MM-DD). Optional: <em>phone</em>,{' '}
          <em>department</em>, <em>clientId</em>, <em>basicSalary</em>. Rows with an email that already
          belongs to an employee will be skipped.
        </p>

        {err && <div className="alert alert--err" style={{ marginBottom: 12 }}>{err}</div>}

        {result ? (
          <div>
            <div className="alert alert--ok" style={{ marginBottom: 12 }}>
              Import complete: <strong>{result.created}</strong> created,{' '}
              <strong>{result.skipped}</strong> skipped (already existed),{' '}
              <strong>{result.errors.length}</strong> errors.
            </div>
            {result.errors.length > 0 && (
              <ul className="small" style={{ marginBottom: 12, color: 'var(--danger, #b91c1c)' }}>
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            )}
            <button type="button" className="btn btn--primary" onClick={reset}>Import another file</button>
          </div>
        ) : (
          <form onSubmit={onImport}>
            <label className="rec-form__label" style={{ display: 'block', marginBottom: 12 }}>
              CSV file *
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="auth-input"
                style={{ marginTop: 4 }}
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                required
              />
            </label>

            {file && preview && (
              <div style={{ marginBottom: 12 }}>
                <p className="muted small">
                  {file.name} — <strong>{preview.length}</strong> valid row{preview.length === 1 ? '' : 's'} ready to
                  import{skippedLines > 0 ? `, ${skippedLines} row(s) skipped for missing required fields` : ''}.
                </p>
                <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table className="rec-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>First name</th>
                        <th>Last name</th>
                        <th>Email</th>
                        <th>Job title</th>
                        <th>Start date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((r, i) => (
                        <tr key={i}>
                          <td>{r.firstName}</td>
                          <td>{r.lastName}</td>
                          <td>{r.email}</td>
                          <td>{r.jobTitle}</td>
                          <td>{r.startDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 20 && (
                  <p className="muted small" style={{ marginTop: 4 }}>…and {preview.length - 20} more rows</p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn--primary" disabled={busy || !preview || preview.length === 0}>
                {busy ? 'Importing…' : `Import${preview ? ` ${preview.length} employee${preview.length === 1 ? '' : 's'}` : ''}`}
              </button>
              {file && (
                <button type="button" className="btn btn--ghost" onClick={reset}>Cancel</button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
