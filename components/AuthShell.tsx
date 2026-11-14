import Torus3D from './Torus3D';

/** Split layout shared by sign-in, sign-up and recovery pages. */
export default function AuthShell({ eyebrow, title, intro, steps, children }: {
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  steps?: string[];
  children: React.ReactNode;
}) {
  return <div className="auth-shell">
    <aside className="auth-brand">
      <Torus3D className="auth-torus" />
      <div className="auth-brand-grid" aria-hidden="true" />
      <div className="auth-brand-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-intro">{intro}</p>
        {steps && <ol className="auth-steps">{steps.map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol>}
      </div>
      <p className="auth-brand-foot" lang="hi">यन्त्र <span>· CODE. CREATE. CONQUER.</span></p>
    </aside>
    <section className="auth-main"><div className="auth-card">{children}</div></section>
  </div>;
}
