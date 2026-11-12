/** Public-source export: publication simulation is never available. */
export type TestOnlyVariables = Partial<Record<"CRE_TEST_ONLY_PUBLICATION_DATE" | "NODE_ENV" | "SITE_ENV" | "SITE_INDEXING_ENABLED" | "PREVIEW_ACCESS_MODE" | "SITE_PRODUCTION_ORIGIN", string>>;
export function testOnlyDate(env: TestOnlyVariables, _root: string): null {
  void _root;
  if (env.CRE_TEST_ONLY_PUBLICATION_DATE !== undefined) throw new Error("TEST-ONLY publication simulation is unavailable in the public-source export");
  return null;
}
export function assertTestOnlyMode(env: TestOnlyVariables, root: string, generated: boolean, _phase: string): null {
  void _phase;
  if (generated) throw new Error("TEST-ONLY generated content cannot be built or started in the public-source export");
  return testOnlyDate(env, root);
}
