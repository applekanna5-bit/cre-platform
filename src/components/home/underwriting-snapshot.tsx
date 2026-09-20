import { Surface } from "@/components/ui/primitives";

// Static, fictional demonstration data. No underwriting calculations are performed.
const metrics = [
  ["Underwritten NOI", "$2.14M"],
  ["Indicated Value", "$32.9M"],
  ["LTV", "64.8%"],
  ["DSCR", "1.43×"],
  ["Debt Yield", "10.1%"],
] as const;

export function UnderwritingSnapshot() {
  return (
    <Surface tone="analytical" className="border-t-2 border-t-copper">
      <h2 className="font-editorial text-2xl leading-tight">Harbor View Apartments</h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
        <p className="text-analytical-muted">Multifamily <span aria-hidden="true">·</span> 180 units</p>
        <p className="font-semibold uppercase tracking-[0.08em] text-analytical-highlight">Educational example / 01</p>
      </div>
      <table className="mt-4 w-full table-fixed text-sm">
        <caption className="mb-3 text-left text-xs font-semibold text-analytical-muted">Illustrative underwriting snapshot</caption>
        <thead className="border-y border-analytical-rule bg-analytical-raised text-xs text-analytical-muted">
          <tr><th scope="col" className="w-[58%] py-2 pl-2 text-left font-medium">Metric</th><th scope="col" className="py-2 pr-2 text-right font-medium">Illustrative value</th></tr>
        </thead>
        <tbody className="divide-y divide-analytical-rule">
          {metrics.map(([label, value], index) => (
            <tr key={label}>
              <th scope="row" className="py-3 pr-2 text-left font-medium">{label}</th>
              <td className={`py-3 text-right font-semibold tabular-nums tracking-tight ${index < 2 ? "text-2xl text-on-analytical" : "text-lg text-analytical-steel"}`}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 border-t border-analytical-rule pt-4 text-xs text-analytical-muted">Fictional property and figures for interface demonstration only. Not an actual transaction or investment recommendation.</p>
    </Surface>
  );
}
