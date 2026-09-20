import { Container, Eyebrow, Section } from "@/components/ui/primitives";

const progression = ["Rent Roll / T-12", "Revenue & Expenses", "NOI", "Property Value", "LTV / DSCR / Debt Yield", "Loan Sizing", "Credit Decision"];
const metrics = [
  ["NOI", "Property operating income before financing and certain capital items."],
  ["Cap Rate", "Relationship between property income and value."],
  ["DSCR", "Ability of property cash flow to cover debt service."],
  ["Debt Yield", "NOI relative to loan exposure."],
  ["LTV", "Loan amount relative to property value."],
];

export function KnowledgePreview() {
  return (
    <>
      <Section aria-labelledby="connections-heading" className="border-y border-analytical-rule bg-analytical-raised text-on-analytical">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-16">
            <div>
              <Eyebrow tone="analytical">The analytical sequence</Eyebrow>
              <h2 id="connections-heading" className="mt-3 max-w-[24ch] font-editorial text-3xl leading-tight">Understand how the numbers connect</h2>
            </div>
            <p className="max-w-[48ch] text-analytical-muted lg:self-end">Start with property financials. Follow the relationships through income, value and debt to a credit decision.</p>
          </div>
          <ol aria-label="Learning progression" className="mt-10 grid gap-y-3 sm:grid-cols-2 lg:grid-cols-7">
            {progression.map((step, index) => (
              <li key={step} className="border-l border-analytical-rule py-3 pl-4 pr-3">
                <div aria-hidden="true" className="mb-4 flex items-center justify-between text-xs tabular-nums text-analytical-steel"><span>0{index + 1}</span><span>{index < progression.length - 1 ? "→" : "■"}</span></div>
                <p className="text-sm font-semibold">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
      <Container>
        <Section aria-labelledby="metrics-heading">
          <Eyebrow>The language of analysis</Eyebrow>
          <h2 id="metrics-heading" className="mt-3 font-editorial text-3xl leading-tight">Five metrics. Different perspectives.</h2>
          <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map(([term, definition]) => (
              <div key={term} className="border-t border-border-strong pt-4">
                <dt className="text-xl font-semibold tracking-tight text-steel">{term}</dt>
                <dd className="mt-3 max-w-[32ch] text-sm text-muted">{definition}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </Container>
    </>
  );
}
