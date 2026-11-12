import type { MetadataRoute } from "next";
import { currentContext, currentDelivery } from "@/seo/metadata";
import { seoRobots } from "@/seo/public-pages";
export default function robots(): MetadataRoute.Robots { return seoRobots(currentContext(), currentDelivery()); }
