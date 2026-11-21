/** Presentation navigation, independent of the content taxonomy. */
export type NavigationItem = {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly NavigationItem[];
} & (
  | { readonly kind: "link"; readonly href: `/${string}` }
  | { readonly kind: "planned"; readonly href?: never }
);

export const primaryNavigation = [
  { id: "loan-lifecycle", label: "Loan Lifecycle", kind: "link", href: "/loan-lifecycle" },
  { id: "underwriting", label: "Underwriting", kind: "link", href: "/specializations#underwriting" },
  { id: "property-types", label: "Property Types", kind: "link", href: "/specializations#property-types" },
  { id: "financing-markets", label: "Financing & Markets", kind: "link", href: "/specializations#financing-markets" },
  { id: "servicing", label: "Servicing", kind: "link", href: "/specializations#servicing" },
  { id: "library", label: "Library", kind: "link", href: "/library" },
] as const satisfies readonly NavigationItem[];

export const footerNavigation = [
  { id: "knowledge", label: "Knowledge", items: primaryNavigation.slice(0, 3) },
  { id: "practice", label: "Practice", items: primaryNavigation.slice(3) },
  {
    id: "platform",
    label: "The CRE Ledger",
    items: [
      { id: "about", label: "About", kind: "link", href: "/about" },
      { id: "editorial-standards", label: "Editorial Standards", kind: "link", href: "/editorial-standards" },
    ],
  },
] as const satisfies readonly { id: string; label: string; items: readonly NavigationItem[] }[];
