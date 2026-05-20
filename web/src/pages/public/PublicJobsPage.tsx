import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { fetchPublicJobs, type PublicJob, type PublicTenant } from '../../publicApi';

export function PublicJobsPage() {
  const { slug = '' } = useParams();
  const { tenant } = useOutletContext<{ tenant: PublicTenant }>();
  const [jobs, setJobs] = useState<PublicJob[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicJobs(slug)
      .then(setJobs)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [slug]);

  if (err) return <div className="alert alert--err">{err}</div>;
  if (!jobs) return <p className="muted">Loading open roles…</p>;

  return (
    <div>
      <h2 className="careers__section-title">Open positions at {tenant.name}</h2>
      {jobs.length === 0 ? (
        <p className="muted">No open roles right now. Check back soon or join our talent pool.</p>
      ) : (
        <ul className="careers__jobs">
          {jobs.map((j) => (
            <li key={j.id} className="careers__job-card">
              <h3>{j.title}</h3>
              {j.location && <p className="muted small">{j.location}</p>}
              {j.description && <p className="careers__job-desc">{j.description.slice(0, 200)}…</p>}
              <Link className="btn btn--primary" to={`/apply/${slug}/jobs/${j.id}`}>
                Apply
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
