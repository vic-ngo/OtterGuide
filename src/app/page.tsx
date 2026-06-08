import vendorsData from "@/data/vendors.json";
import type { Vendor } from "@/lib/types";
import DirectoryApp from "@/components/DirectoryApp";

const vendors = vendorsData as Vendor[];

export default function Home() {
  return <DirectoryApp vendors={vendors} />;
}
