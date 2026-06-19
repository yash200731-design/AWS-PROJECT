export type ResourceType = 'EC2' | 'Lambda' | 'S3' | 'RDS';
export type OptimizationStatus = 'optimized' | 'pending_optimization' | 'idle_warning';

export interface CloudResource {
  id: string;
  name: string;
  type: ResourceType;
  region: string;
  energyUsageKwh: number; // kWh per month
  carbonEmissionKg: number; // kg CO2e per month
  monthlyCost: number; // USD
  status: OptimizationStatus;
  suggestion?: string;
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType | 'All' | 'Multi';
  resourceId?: string;
  co2ReductionKg: number;
  costSavingsUsd: number;
  priority: PriorityLevel;
  applied: boolean;
}

export interface RegionalMetric {
  region: string;
  name: string;
  carbonIntensityG: number; // g CO2e / kWh (lower is greener)
  gridIcon: string;
  activeCount: number;
}

export interface AuditHistoryEntry {
  date: string; // e.g., '2026-01', '2026-02'
  emissionsKg: number;
  costUsd: number;
  energyKwh: number;
}

export interface AppSettings {
  awsConnected: boolean;
  awsAccountId: string;
  auditFrequency: 'Daily' | 'Weekly' | 'Monthly';
  preferredRegions: string[];
  autoOptimize: boolean;
}
