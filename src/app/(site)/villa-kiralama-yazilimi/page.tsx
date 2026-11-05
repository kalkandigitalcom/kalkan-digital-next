import { villaPillar } from "@/lib/service-pages";
import { ServicePageView } from "@/components/public/service/service-page";
import { serviceMetadata } from "@/components/public/service/metadata";

export const dynamic = "force-dynamic";
export const metadata = serviceMetadata(villaPillar);

export default function VillaSoftwarePage() {
  return <ServicePageView page={villaPillar} />;
}
