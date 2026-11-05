import { hubPage } from "@/lib/service-pages";
import { ServicePageView } from "@/components/public/service/service-page";
import { serviceMetadata } from "@/components/public/service/metadata";

export const dynamic = "force-dynamic";
export const metadata = serviceMetadata(hubPage);

export default function ServicesHubPage() {
  return <ServicePageView page={hubPage} />;
}
