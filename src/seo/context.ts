import { resolveSiteConfig, type SiteVariables } from "../config/site";
import { indexingPolicy, type PublicationMode } from "./policy";

export function resolveSeoContext(variables: SiteVariables, mode: PublicationMode) {
  const site = resolveSiteConfig(variables);
  return Object.freeze({ site, mode, policy: indexingPolicy(site, mode) });
}
