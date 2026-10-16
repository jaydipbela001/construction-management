import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Download, HardHat } from 'lucide-react';
import reportService from '../services/reportService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatNumber } from '../utils/currency';
import { formatDate } from '../utils/date';
import { STATUS_LABEL } from '../utils/constants';
import './ProjectReport.css';

function DetailItem({ label, value }) {
  return (
    <div className="report__detail">
      <span className="report__detail-label">{label}</span>
      <span className="report__detail-value">{value}</span>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="report__metric">
      <span className="report__metric-label">{label}</span>
      <span className="report__metric-value">{value}</span>
      {hint ? <span className="report__metric-hint">{hint}</span> : null}
    </div>
  );
}

export default function ProjectReport() {
  const { projectId } = useParams();
  const [report, setReport] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await reportService.getProjectReport(projectId);
        if (active) {
          setReport(data);
          setGeneratedAt(new Date());
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load the report.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner label="Preparing report…" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page">
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error || 'Report not available.'}</span>
        </div>
        <Link to={`/projects/${projectId}`} className="btn btn-secondary mt-4">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to project
        </Link>
      </div>
    );
  }

  const { project, totals, materials, expenses } = report;

  return (
    <div className="report">
      <div className="report__toolbar no-print">
        <Link to={`/projects/${projectId}`} className="btn btn-secondary">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to project
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Download size={16} aria-hidden="true" />
          Download PDF
        </button>
      </div>

      <article className="report__doc">
        <header className="report__masthead">
          <div className="report__brand">
            <span className="report__logo" aria-hidden="true">
              <HardHat size={24} />
            </span>
            <span className="report__brand-text">
              <span className="report__brand-name">BuildTrack</span>
              <span className="report__brand-sub">Construction Management</span>
            </span>
          </div>
          <div className="report__doc-title">
            <h1>Project Report</h1>
            <p>Generated {formatDate(generatedAt)}</p>
          </div>
        </header>

        <section className="report__identity">
          <span className="report__eyebrow">Project</span>
          <h2 className="report__project-name">{project.name}</h2>
          <div className="report__project-meta">
            <span className="mono">{project.projectCode}</span>
            <span className="report__dot" aria-hidden="true" />
            <span className="report__status">{STATUS_LABEL[project.status] || project.status}</span>
            {project.location ? (
              <>
                <span className="report__dot" aria-hidden="true" />
                <span>{project.location}</span>
              </>
            ) : null}
          </div>
        </section>

        <section className="report__summary">
          <Metric
            label="Estimated Material Value"
            value={formatCurrency(totals.estimatedMaterialValue)}
            hint="Value of materials on site"
          />
          <Metric
            label="Recorded Expenses"
            value={formatCurrency(totals.totalExpenses)}
            hint="Actual amount spent"
          />
          <Metric
            label="Material Entries"
            value={formatNumber(totals.materialCount)}
            hint="Line items logged"
          />
          <Metric
            label="Expense Entries"
            value={formatNumber(totals.expenseCount)}
            hint="Payments recorded"
          />
        </section>

        <section className="report__section">
          <h3 className="report__section-title">Project details</h3>
          <div className="report__details-grid">
            <DetailItem label="Location" value={project.location || '—'} />
            <DetailItem label="Status" value={STATUS_LABEL[project.status] || project.status} />
            <DetailItem label="Start date" value={formatDate(project.startDate)} />
            <DetailItem
              label="Expected completion"
              value={formatDate(project.expectedCompletionDate)}
            />
            <DetailItem
              label="Actual completion"
              value={formatDate(project.actualCompletionDate)}
            />
            <DetailItem label="Created" value={formatDate(project.createdAt)} />
            <DetailItem label="Last updated" value={formatDate(project.updatedAt)} />
            <DetailItem label="Project code" value={project.projectCode} />
          </div>
          {project.description ? (
            <p className="report__description">{project.description}</p>
          ) : null}
        </section>

        <section className="report__section">
          <div className="report__section-head">
            <h3 className="report__section-title">Materials</h3>
            <span className="report__section-count">{formatNumber(materials.length)} items</span>
          </div>
          {materials.length ? (
            <div className="report__table-wrap">
            <table className="report__table">
              <thead>
                <tr>
                  <th className="report__col-num">#</th>
                  <th>Material</th>
                  <th>Category</th>
                  <th className="report__col-num">Qty</th>
                  <th>Unit</th>
                  <th className="report__col-num">Used</th>
                  <th className="report__col-num">Stock</th>
                  <th className="report__col-num">Unit Price</th>
                  <th className="report__col-num">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, index) => (
                  <tr key={m._id}>
                    <td className="report__col-num">{index + 1}</td>
                    <td>
                      <span className="report__cell-strong">{m.name}</span>
                      {m.supplier ? <span className="report__cell-sub">{m.supplier}</span> : null}
                    </td>
                    <td>{m.category || '—'}</td>
                    <td className="report__col-num mono">{formatNumber(m.quantity)}</td>
                    <td>{m.unit}</td>
                    <td className="report__col-num mono">{formatNumber(m.usedQuantity || 0)}</td>
                    <td className="report__col-num mono">{formatNumber(m.currentStock || 0)}</td>
                    <td className="report__col-num mono">{formatCurrency(m.unitPrice)}</td>
                    <td className="report__col-num mono report__cell-strong">
                      {formatCurrency(m.lineTotal || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={8} className="report__total-label">
                    Total estimated material value
                  </td>
                  <td className="report__col-num mono report__total-value">
                    {formatCurrency(totals.estimatedMaterialValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          ) : (
            <p className="report__empty">No materials recorded for this project.</p>
          )}
        </section>

        <section className="report__section">
          <div className="report__section-head">
            <h3 className="report__section-title">Expenses</h3>
            <span className="report__section-count">{formatNumber(expenses.length)} entries</span>
          </div>
          {expenses.length ? (
            <table className="report__table">
              <thead>
                <tr>
                  <th className="report__col-num">#</th>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Method</th>
                  <th>Payee</th>
                  <th className="report__col-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, index) => (
                  <tr key={e._id}>
                    <td className="report__col-num">{index + 1}</td>
                    <td className="mono">{formatDate(e.expenseDate)}</td>
                    <td className="report__cell-strong">{e.title}</td>
                    <td>{e.category || '—'}</td>
                    <td>{e.paymentMethod ? e.paymentMethod.replace(/_/g, ' ') : '—'}</td>
                    <td>{e.payee || '—'}</td>
                    <td className="report__col-num mono report__cell-strong">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="report__total-label">
                    Total recorded expenses
                  </td>
                  <td className="report__col-num mono report__total-value">
                    {formatCurrency(totals.totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="report__empty">No expenses recorded for this project.</p>
          )}
        </section>

        {project.notes ? (
          <section className="report__section">
            <h3 className="report__section-title">Notes</h3>
            <p className="report__description">{project.notes}</p>
          </section>
        ) : null}

        <footer className="report__footer">
          <span>
            {project.name} · {project.projectCode}
          </span>
          <span>BuildTrack — Confidential</span>
        </footer>
      </article>
    </div>
  );
}
