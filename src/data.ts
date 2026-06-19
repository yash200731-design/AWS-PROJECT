import { CloudResource, AIRecommendation, RegionalMetric, AuditHistoryEntry, AppSettings } from './types';

export const INITIAL_RESOURCES: CloudResource[] = [
  // EC2 Instances
  {
    id: 'i-0ab12cd34ef567gh1',
    name: 'prod-api-cluster-nodes',
    type: 'EC2',
    region: 'us-east-1', // N. Virginia (High carbon intensity: ~370g/kWh)
    energyUsageKwh: 3420,
    carbonEmissionKg: 1265.4,
    monthlyCost: 580.00,
    status: 'pending_optimization',
    suggestion: 'Migrate active instances to us-west-2 (Oregon) to cut CO₂ by 67%'
  },
  {
    id: 'i-0cd98ef11ab22cd33',
    name: 'dev-sandbox-bastion',
    type: 'EC2',
    region: 'us-east-1',
    energyUsageKwh: 450,
    carbonEmissionKg: 166.5,
    monthlyCost: 110.00,
    status: 'idle_warning',
    suggestion: 'Instance on 100% idle for 14 days. Terminating saves $110.00 and 166kg CO₂'
  },
  {
    id: 'i-0xx77yy88zz99aa00',
    name: 'prod-payment-worker',
    type: 'EC2',
    region: 'us-west-2', // Oregon (Low carbon intensity: ~110g/kWh)
    energyUsageKwh: 1200,
    carbonEmissionKg: 132.0,
    monthlyCost: 240.00,
    status: 'optimized'
  },
  {
    id: 'i-0mm55nn66oo77pp88',
    name: 'batch-ml-inference-spot',
    type: 'EC2',
    region: 'eu-west-1', // Ireland (~290g/kWh)
    energyUsageKwh: 2800,
    carbonEmissionKg: 812.0,
    monthlyCost: 290.00,
    status: 'pending_optimization',
    suggestion: 'Schedule Spot workloads specifically during overnight solar/wind abundance windows'
  },

  // Lambda Functions
  {
    id: 'f-event-router-prod',
    name: 'event-router-production',
    type: 'Lambda',
    region: 'us-east-1',
    energyUsageKwh: 85,
    carbonEmissionKg: 31.4,
    monthlyCost: 42.50,
    status: 'optimized'
  },
  {
    id: 'f-pdf-processor-heavy',
    name: 'invoice-pdf-generator',
    type: 'Lambda',
    region: 'eu-central-1', // Frankfurt (~280g/kWh)
    energyUsageKwh: 310,
    carbonEmissionKg: 86.8,
    monthlyCost: 124.00,
    status: 'pending_optimization',
    suggestion: 'Provisioned concurrency is over-allocated. Reduce to 2 instances to save energy.'
  },

  // S3 Buckets
  {
    id: 'b-gcc-analytics-raw-data',
    name: 'gcc-analytics-raw-uncompressed',
    type: 'S3',
    region: 'us-east-1',
    energyUsageKwh: 890,
    carbonEmissionKg: 329.3,
    monthlyCost: 450.00,
    status: 'pending_optimization',
    suggestion: 'Enable Intelligent-Tiering lifecycle rules to transition 70% cold data to Glacier'
  },
  {
    id: 'b-user-assets-optimized',
    name: 'user-profile-assets-cdn',
    type: 'S3',
    region: 'us-west-2',
    energyUsageKwh: 120,
    carbonEmissionKg: 13.2,
    monthlyCost: 85.00,
    status: 'optimized'
  },

  // RDS Databases
  {
    id: 'db-prod-postgres-main',
    name: 'production-postgres-primary',
    type: 'RDS',
    region: 'us-east-1',
    energyUsageKwh: 4800,
    carbonEmissionKg: 1776.0,
    monthlyCost: 1280.00,
    status: 'pending_optimization',
    suggestion: 'Resize instance from r6g.2xlarge to r6g.xlarge. Current CPU utilization < 12%'
  },
  {
    id: 'db-read-replica-eu',
    name: 'reports-replica-frankfurt',
    type: 'RDS',
    region: 'eu-central-1',
    energyUsageKwh: 1550,
    carbonEmissionKg: 434.0,
    monthlyCost: 410.00,
    status: 'optimized'
  }
];

export const INITIAL_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Migrate N. Virginia (us-east-1) Servers to Oregon (us-west-2)',
    description: 'The green energy grid capacity in Oregon operates with a carbon intensity index of just 110g/kWh, compared to N. Virginia’s coal-heavy 370g/kWh. Migrating the multi-node API cluster will significantly curtail greenhouse gas discharge.',
    resourceType: 'EC2',
    resourceId: 'i-0ab12cd34ef567gh1',
    co2ReductionKg: 840,
    costSavingsUsd: 45.00,
    priority: 'High',
    applied: false
  },
  {
    id: 'rec-002',
    title: 'Decommission Idle Sandbox Bastion Instance',
    description: 'The bastion host in us-east-1 has had 0 active sessions and near-zero bandwidth utilization for two continuous weeks. Terminating it is safe and provides immediate 100% emission reduction.',
    resourceType: 'EC2',
    resourceId: 'i-0cd98ef11ab22cd33',
    co2ReductionKg: 166.5,
    costSavingsUsd: 110.00,
    priority: 'High',
    applied: false
  },
  {
    id: 'rec-003',
    title: 'Deploy Storage Lifecycle Policies for Archive Buckets',
    description: 'Analytics raw bucket stores 12TB of uncompressed raw logs. Transitioning historical data above 30 days old to S3 Glacier Deep Archive reduces active spinning disk sector overhead.',
    resourceType: 'S3',
    resourceId: 'b-gcc-analytics-raw-data',
    co2ReductionKg: 198.0,
    costSavingsUsd: 280.00,
    priority: 'Medium',
    applied: false
  },
  {
    id: 'rec-004',
    title: 'Optimize Postgres Database Instance CPU Allocation',
    description: 'Main production RDS instance CPU averages under 12%, peaking at 20%. Downsizing instance from db.r6g.2xlarge to db.r6g.xlarge saves substantial server heat dissipation expenses and budget without introducing query lag.',
    resourceType: 'RDS',
    resourceId: 'db-prod-postgres-main',
    co2ReductionKg: 812.0,
    costSavingsUsd: 640.00,
    priority: 'High',
    applied: false
  },
  {
    id: 'rec-005',
    title: 'Re-align Lambda Concurrency parameters',
    description: 'The invoice generation function has unnecessary pre-allocated warm concurrency limits. Reverting to purely demand-driven scale decreases standby server thermal profiles.',
    resourceType: 'Lambda',
    resourceId: 'f-pdf-processor-heavy',
    co2ReductionKg: 35.0,
    costSavingsUsd: 62.00,
    priority: 'Low',
    applied: false
  }
];

export const REGIONAL_DATA: RegionalMetric[] = [
  { region: 'us-east-1', name: 'US East (N. Virginia)', carbonIntensityG: 370, gridIcon: '🇺🇸', activeCount: 5 },
  { region: 'us-west-2', name: 'US West (Oregon)', carbonIntensityG: 110, gridIcon: '🌲', activeCount: 2 },
  { region: 'eu-west-1', name: 'Europe (Ireland)', carbonIntensityG: 290, gridIcon: '🇮🇪', activeCount: 1 },
  { region: 'eu-central-1', name: 'Europe (Frankfurt)', carbonIntensityG: 280, gridIcon: '🇩🇪', activeCount: 2 },
  { region: 'eu-north-1', name: 'Europe (Stockholm)', carbonIntensityG: 12, gridIcon: '🇸🇪', activeCount: 0 },
  { region: 'ca-central-1', name: 'Canada (Central)', carbonIntensityG: 30, gridIcon: '🇨🇦', activeCount: 0 }
];

export const INITIAL_HISTORY: AuditHistoryEntry[] = [
  { date: 'Jan 2026', emissionsKg: 4200, costUsd: 3820, energyKwh: 12700 },
  { date: 'Feb 2026', emissionsKg: 4050, costUsd: 3710, energyKwh: 12100 },
  { date: 'Mar 2026', emissionsKg: 3890, costUsd: 3580, energyKwh: 11600 },
  { date: 'Apr 2026', emissionsKg: 3950, costUsd: 3620, energyKwh: 11800 },
  { date: 'May 2026', emissionsKg: 3620, costUsd: 3350, energyKwh: 10900 },
  { date: 'Jun 2026', emissionsKg: 3420, costUsd: 3180, energyKwh: 10200 } // Live baseline
];

export const INITIAL_SETTINGS: AppSettings = {
  awsConnected: true,
  awsAccountId: '4832-9011-3329',
  auditFrequency: 'Weekly',
  preferredRegions: ['us-west-2', 'eu-north-1'],
  autoOptimize: false
};
