/** Presentation navigation only; this is not the content taxonomy or a route registry. */
export type NavigationItem = {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly NavigationItem[];
} & (
  | { readonly kind: "link"; readonly href: `/${string}` }
  | { readonly kind: "planned"; readonly href?: never }
);

export const primaryNavigation = [
  { id: "learn", label: "Learn", kind: "link", href: "/#learn", summary: "CRE foundations and concepts." },
  { id: "underwriting", label: "Underwriting", kind: "link", href: "/#underwriting", summary: "Property analysis and credit decisions." },
  { id: "property-types", label: "Property Types", kind: "link", href: "/#property-types", summary: "Knowledge organized by property type." },
  { id: "financing", label: "Financing", kind: "link", href: "/#financing", summary: "CRE debt and lending." },
  { id: "modeling", label: "Modeling", kind: "link", href: "/#modeling", summary: "Financial modeling and pro formas." },
  { id: "tools", label: "Tools", kind: "link", href: "/#tools", summary: "Calculators and decision-support tools." },
  { id: "resources", label: "Resources", kind: "link", href: "/#resources", summary: "Reference material and practical resources." },
] as const satisfies readonly (NavigationItem & { readonly summary: string })[];

export const homepagePaths = [
  { sectionId: "learn", label: "Learn CRE" },
  { sectionId: "underwriting", label: "Underwrite a Deal" },
  { sectionId: "tools", label: "Use CRE Tools" },
] as const satisfies readonly {
  sectionId: (typeof primaryNavigation)[number]["id"];
  label: string;
}[];

export const footerNavigation = [
  { id: "knowledge", label: "Knowledge", items: primaryNavigation.slice(0, 4) },
  { id: "practice", label: "Practice", items: primaryNavigation.slice(4) },
  {
    id: "platform",
    label: "Platform",
    items: [
      { id: "glossary", label: "Glossary", kind: "planned" },
      { id: "contributors", label: "Contributors", kind: "planned" },
      { id: "about", label: "About & editorial", kind: "planned" },
    ],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  items: readonly NavigationItem[];
}[];
