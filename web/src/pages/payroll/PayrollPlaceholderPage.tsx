type Props = {
  title: string;
};

export function PayrollPlaceholderPage({ title }: Props) {
  return (
    <div className="rec-page">
      <header className="rec-page__header">
        <div>
          <h1 className="rec-page__title">{title}</h1>
          <p className="rec-page__sub">This section is coming soon.</p>
        </div>
      </header>
    </div>
  );
}
