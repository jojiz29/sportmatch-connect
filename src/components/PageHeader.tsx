export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl tracking-wide text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground/70 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
