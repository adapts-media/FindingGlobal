import { type ServiceCategory } from "./mock-data";
import servicesJson from "./services.json";

export interface ServiceInfo {
  title: string;
  category?: ServiceCategory;
  parent?: string;
}

export const SLUG_TO_INFO = servicesJson as Record<string, ServiceInfo>;
