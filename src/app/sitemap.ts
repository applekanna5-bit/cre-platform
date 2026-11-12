import type { MetadataRoute } from "next";
import { catalog } from "@/content/.generated";
import { currentContext, currentDelivery } from "@/seo/metadata";
import { publicSeoPages } from "@/seo/public-pages";
export default function sitemap(): MetadataRoute.Sitemap { return publicSeoPages(catalog, currentContext(), currentDelivery()); }
