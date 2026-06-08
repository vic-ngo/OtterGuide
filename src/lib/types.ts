export interface VendorLocation {
  /** The "Location" label from the source sheet (e.g. a branch name). */
  label?: string;
  address: string;
  /** Derived city used for filtering. */
  city: string;
  lat?: number;
  lng?: number;
  /**
   * True when the location is the whole region (sheet value "San Francisco Bay
   * Area"). These vendors serve clients in-home throughout the Bay Area rather
   * than at one fixed address, so they are not pinned on the map.
   */
  regionWide?: boolean;
  /** True when the location is "Online" (remote service, not pinned). */
  online?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  /** One or more categories the vendor falls under. */
  categories: string[];
  subcategories: string[];
  fundingAccepted: string[];
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  locations: VendorLocation[];
}
