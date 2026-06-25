import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CloudAlert, 
  DollarSign, 
  Percent, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  TrendingDown, 
  Activity, 
  Flame, 
  Zap,
  Globe,
  Cpu,
  Server,
  Database,
  Clock,
  Calendar,
  CheckCircle2,
  Leaf,
  ArrowRightLeft,
  Settings,
  Shuffle
} from 'lucide-react';
import { CloudResource, AIRecommendation, AuditHistoryEntry, TelemetryData, LiveEvent } from '../types';

interface DashboardProps {
  resources: CloudResource[];
  recommendations: AIRecommendation[];
  history: AuditHistoryEntry[];
  applyRecommendation: (id: string) => void;
  setActiveTab: (tab: string) => void;
  telemetryEnabled: boolean;
  setTelemetryEnabled: (enabled: boolean) => void;
  telemetryDataHistory: TelemetryData[];
  liveEventsList: LiveEvent[];
  workloadsShifted: boolean;
  toggleWorkloadShifting: () => void;
  archMigrated: boolean;
  toggleArchMigration: () => void;
}

export default function Dashboard({
  resources,
  recommendations,
  history,
  applyRecommendation,
  setActiveTab,
  telemetryEnabled,
  setTelemetryEnabled,
  telemetryDataHistory,
  liveEventsList,
  workloadsShifted,
  toggleWorkloadShifting,
  archMigrated,
  toggleArchMigration
}: DashboardProps) {
  
  // Local state for interactive chart hovers
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);

  // Core metrics calculation dynamically based on applied recommendations and active resources
  const pendingRecommendations = recommendations.filter(r => !r.applied);
  const appliedRecommendations = recommendations.filter(r => r.applied);

  // 1. Total active carbon footprint (kg CO2e)
  // Let's calculate from resource list
  const totalEmissionsBaseline = resources.reduce((sum, res) => sum + res.carbonEmissionKg, 0);
  // Subtract applied reduction achievements
  const currentTotalEmissions = totalEmissionsBaseline; 

  // 2. Cost savings achieved
  const totalCostSavingsVal = appliedRecommendations.reduce((sum, r) => sum + r.costSavingsUsd, 0);
  const potentialSavingsVal = pendingRecommendations.reduce((sum, r) => sum + r.costSavingsUsd, 0);

  // 3. Carbon reduction achieved in kg
  const carbonReducedKg = appliedRecommendations.reduce((sum, r) => sum + r.co2ReductionKg, 0);
  // Total baseline emissions before any optimizer was applied
  const baselineEmissionsFull = totalEmissionsBaseline + appliedRecommendations.reduce((sum, r) => sum + r.co2ReductionKg, 0);
  const carbonReducedPct = baselineEmissionsFull > 0 
    ? Math.round((carbonReducedKg / baselineEmissionsFull) * 100) 
    : 0;

  // 4. Counts
  const activeResourcesCount = resources.length;
  const pendingOptimizationsCount = resources.filter(r => r.status !== 'optimized').length;

  const initialBaseScore = 55;
  const targetDiff = 25;
  const ratioApplied = recommendations.length > 0 ? (appliedRecommendations.length / recommendations.length) : 0;
  let dynamicSustainabilityScore = initialBaseScore + Math.round(ratioApplied * targetDiff);
  if (workloadsShifted) dynamicSustainabilityScore += 10;
  if (archMigrated) dynamicSustainabilityScore += 10;
  dynamicSustainabilityScore = Math.min(100, dynamicSustainabilityScore);

  // Sector breakdown calculations for interactive energy resource pie / donut chart
  const energyBySector = resources.reduce((acc, resource) => {
    const key = resource.type;
    const currentVal = acc[key] || 0;
    acc[key] = currentVal + resource.energyUsageKwh;
    return acc;
  }, {} as Record<string, number>);

  const sectors = Object.entries(energyBySector).map(([type, value]) => ({ type, value }));
  const totalEnergy = sectors.reduce((sum, s) => sum + s.value, 0);

  // Donut colors matching modern design palettes
  const sectorColors: Record<string, { bg: string, text: string, stroke: string }> = {
    EC2: { bg: 'bg-emerald-500', text: 'text-emerald-500', stroke: '#10b981' },
    RDS: { bg: 'bg-blue-500', text: 'text-blue-500', stroke: '#3b82f6' },
    S3: { bg: 'bg-amber-500', text: 'text-amber-500', stroke: '#f59e0b' },
    Lambda: { bg: 'bg-rose-500', text: 'text-rose-500', stroke: '#f43f5e' },
  };

  // Convert sector to percentages
  const donutData = sectors.map(sec => {
    const percentage = totalEnergy > 0 ? Math.round((sec.value / totalEnergy) * 100) : 0;
    return {
      type: sec.type,
      value: sec.value,
      percentage,
      ...sectorColors[sec.type] || { bg: 'bg-gray-500', text: 'text-gray-500', stroke: '#6b7280' }
    };
  });

  // Calculate cumulative stroke offset for rendering high-fidelity SVG Donut
  let accumulatedPercentage = 0;

  // Construct coordinates for emissions Line graph
  // Data entries: Jan to June
  // Let the final point (June) actively decrement based on applied recommendations!
  const plottedHistory = history.map((entry, idx) => {
    if (idx === history.length - 1) {
      // Modify last month based on applied recommendations (makes the chart LIVE!)
      const JuneOptimizedEmissions = Math.max(1200, entry.emissionsKg - carbonReducedKg);
      return { ...entry, emissionsKg: JuneOptimizedEmissions };
    }
    return entry;
  });

  const maxVal = Math.max(...plottedHistory.map(d => d.emissionsKg)) * 1.1;
  const minVal = Math.min(...plottedHistory.map(d => d.emissionsKg)) * 0.9;
  
  // Mapping values to SVG coordinates (width 480, height 170)
  // Margins: left 50, right 20, top 20, bottom 30
  const width = 480;
  const height = 170;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = plottedHistory.map((item, index) => {
    const x = paddingLeft + (index / (plottedHistory.length - 1)) * plotWidth;
    // Scale emissions proportionally
    const ratio = (item.emissionsKg - minVal) / (maxVal - minVal);
    const y = paddingTop + plotHeight - (ratio * plotHeight);
    return { x, y, ...item };
  });

  // Create path description string for line chart (curved bezier path approach for beautiful design)
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      // Midpoints for control vectors
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  // Shadow path to fill standard gradient area beneath emission curve
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Real-time chart mapping (width 320, height 80)
  const rtWidth = 320;
  const rtHeight = 80;
  const rtPaddingLeft = 5;
  const rtPaddingRight = 5;
  const rtPaddingTop = 10;
  const rtPaddingBottom = 5;
  const rtPlotWidth = rtWidth - rtPaddingLeft - rtPaddingRight;
  const rtPlotHeight = rtHeight - rtPaddingTop - rtPaddingBottom;

  const rtPoints = telemetryDataHistory.map((item, index) => {
    const x = rtPaddingLeft + (index / Math.max(1, telemetryDataHistory.length - 1)) * rtPlotWidth;
    const rates = telemetryDataHistory.map(d => d.carbonEmissionRateGps);
    const maxRate = Math.max(...rates, 2);
    const minRate = Math.min(...rates, 0.5);
    const range = maxRate - minRate || 1;
    const ratio = (item.carbonEmissionRateGps - minRate) / range;
    const y = rtPaddingTop + rtPlotHeight - (ratio * rtPlotHeight);
    return { x, y };
  });

  let rtLinePath = '';
  let rtAreaPath = '';
  if (rtPoints.length > 0) {
    rtLinePath = `M ${rtPoints[0].x} ${rtPoints[0].y}`;
    for (let i = 1; i < rtPoints.length; i++) {
      rtLinePath += ` L ${rtPoints[i].x} ${rtPoints[i].y}`;
    }
    rtAreaPath = `${rtLinePath} L ${rtPoints[rtPoints.length - 1].x} ${rtHeight - rtPaddingBottom} L ${rtPoints[0].x} ${rtHeight - rtPaddingBottom} Z`;
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-amber-500/10 blur-[80px]" />
        <div className="absolute bottom-0 left-10 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px]" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AWS Cloud Carbon Audit Room</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 bg-clip-text text-transparent">
              Green Code Choice
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Analyze, schedule, and migrate your active cloud assets to low-carbon regions. Achieve up to 85% emission reduction using grid-aware workload orchestrations.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto p-4 rounded-xl bg-slate-955/60 border border-slate-800/80 backdrop-blur-sm text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between gap-6 border-b border-slate-800/85 pb-2">
              <span className="text-slate-500 font-semibold uppercase">Account</span>
              <span className="text-amber-500 font-bold">4832-9011-3329</span>
            </div>
            <div className="flex justify-between gap-6 border-b border-slate-800/85 pb-2">
              <span className="text-slate-500 font-semibold uppercase">Primary Grid</span>
              <span className={archMigrated ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-500 font-bold flex items-center gap-1"}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                {archMigrated ? "us-west-2 (Oregon)" : "us-east-1 (N. Virginia)"}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500 font-semibold uppercase">Scope</span>
              <span className="text-emerald-400 font-bold">Eco-Optimized</span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            id="hero-toggle-telemetry-btn"
            onClick={() => setTelemetryEnabled(!telemetryEnabled)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-550 hover:bg-amber-600 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>{telemetryEnabled ? "Disconnect Telemetry" : "Connect Live Telemetry"}</span>
          </button>
          <button 
            id="hero-migrate-tab-btn"
            onClick={() => setActiveTab('resources')}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 hover:border-amber-500/50 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-slate-100 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Analyze active resources</span>
          </button>
          <div className="flex items-center gap-2 ml-auto text-xs font-mono font-bold text-slate-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-wider">AWS Agent: Uptime 99.98%</span>
          </div>
        </div>
      </div>

      {/* 2. CARBON FOOTPRINT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI: Current Carbon */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm relative overflow-hidden group text-left flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Carbon</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-bold text-2xl text-slate-100">
                {currentTotalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <div className="w-full bg-slate-850 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-500" 
                style={{ width: `${Math.max(30, Math.min(100, (currentTotalEmissions / 4500) * 100))}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-sans text-emerald-400 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{carbonReducedKg > 0 ? `-${carbonReducedKg.toFixed(0)}kg reduced` : 'Optimizations pending'}</span>
          </div>
        </div>

        {/* KPI: Cost Savings */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm relative overflow-hidden group text-left flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OpEx Savings</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-bold text-2xl text-slate-100">
                ${totalCostSavingsVal.toFixed(0)}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">saved/Mo</span>
            </div>
          </div>
          <p className="text-[11px] truncate">
            {potentialSavingsVal > 0 ? (
              <span className="text-amber-500 font-semibold">${potentialSavingsVal.toFixed(0)} more potential</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Maximum efficiency!</span>
            )}
          </p>
        </div>

        {/* KPI: Reduction % */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm relative overflow-hidden group text-left flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CO₂ Reduction</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-bold text-2xl text-slate-100">
                {carbonReducedPct}%
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">achieved</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            vs sandbox baseline limits.
          </p>
        </div>

        {/* KPI: Region Target */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm relative overflow-hidden group text-left flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Region Target</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xs font-bold text-slate-100 truncate">
              {archMigrated ? "Green Oregon Grid" : "Coal Virginia Grid"}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {archMigrated ? "us-west-2 (110g)" : "us-east-1 (370g)"}
            </div>
          </div>
          <button 
            id="kpi-migrate-toggle-btn"
            onClick={toggleArchMigration}
            className="text-[10px] text-amber-500 font-bold uppercase tracking-wider hover:underline text-left cursor-pointer"
          >
            {archMigrated ? "Revert Location" : "Green-Migrate"}
          </button>
        </div>

        {/* KPI: AI Score Gauge */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm relative overflow-hidden group text-left flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-slate-900/60 to-emerald-950/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Score</span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-sans font-bold text-3xl text-emerald-400">
              {dynamicSustainabilityScore}
            </span>
            <span className="text-xs font-medium text-emerald-500/70">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-500" 
              style={{ width: `${dynamicSustainabilityScore}%` }}
            />
          </div>
        </div>

      </div>

      {/* 3. ARCHITECTURE DIAGRAM SECTION */}
      <div className="p-6 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>AWS System Architecture Carbon Mapping</span>
            </h2>
            <p className="text-xs text-slate-400">
              Visualizing active node geography. Red/Orange components operate on high-emissions coal grids. Green nodes are optimized.
            </p>
          </div>
          
          <button 
            id="diagram-migrate-trigger-btn"
            onClick={toggleArchMigration}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              archMigrated 
                ? 'bg-slate-800 border border-slate-700 hover:bg-slate-705 text-slate-350'
                : 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-extrabold hover:opacity-90 shadow-lg shadow-amber-500/10'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{archMigrated ? "Revert Architecture" : "Green-Migrate Architecture"}</span>
          </button>
        </div>

        {/* Responsive Flex Architecture flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 py-4 relative">
          
          {/* Node 1: DNS Route 53 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm relative flex flex-col justify-between h-32 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Server className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">AWS Route 53</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Global DNS routing</div>
              <div className="mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                100% Offset (Clean)
              </div>
            </div>
          </div>

          {/* Node 2: CDN CloudFront */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm relative flex flex-col justify-between h-32 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">CloudFront CDN</div>
              <div className="text-xs font-bold text-slate-200 mt-1">User Edge Caching</div>
              <div className="mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                Edge optimized
              </div>
            </div>
          </div>

          {/* Node 3: API Gateway */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm relative flex flex-col justify-between h-32 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">API Gateway</div>
              <div className="text-xs font-bold text-slate-200 mt-1">REST Endpoint router</div>
              <div className="mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                Serverless Scale
              </div>
            </div>
          </div>

          {/* Node 4: Compute Cluster (EC2) */}
          <div className={`p-4 rounded-xl bg-slate-950/60 border backdrop-blur-sm relative flex flex-col justify-between h-32 transition-all duration-300 ${
            archMigrated ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  archMigrated ? 'bg-emerald-400' : 'bg-amber-450'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  archMigrated ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">EC2 Web Cluster</div>
              <div className="text-xs font-bold text-slate-200 mt-1">prod-api-cluster</div>
              <div className={`mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded ${
                archMigrated 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
              }`}>
                {archMigrated ? 'us-west-2 (Oregon)' : 'us-east-1 (Virginia)'}
              </div>
            </div>
          </div>

          {/* Node 5: Database (RDS) */}
          <div className={`p-4 rounded-xl bg-slate-950/60 border backdrop-blur-sm relative flex flex-col justify-between h-32 transition-all duration-300 ${
            archMigrated ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  archMigrated ? 'bg-emerald-400' : 'bg-amber-450'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  archMigrated ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">RDS Database</div>
              <div className="text-xs font-bold text-slate-200 mt-1">postgres-primary</div>
              <div className={`mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded ${
                archMigrated 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
              }`}>
                {archMigrated ? 'us-west-2 (Oregon)' : 'us-east-1 (Virginia)'}
              </div>
            </div>
          </div>

          {/* Node 6: Storage (S3) */}
          <div className={`p-4 rounded-xl bg-slate-950/60 border backdrop-blur-sm relative flex flex-col justify-between h-32 transition-all duration-300 ${
            archMigrated ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  archMigrated ? 'bg-emerald-400' : 'bg-amber-450'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  archMigrated ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-550 font-bold uppercase font-mono">S3 Storage</div>
              <div className="text-xs font-bold text-slate-200 mt-1">analytics-raw</div>
              <div className={`mt-1.5 inline-flex text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded ${
                archMigrated 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
              }`}>
                {archMigrated ? 'us-west-2 (Oregon)' : 'us-east-1 (Virginia)'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. WORKLOAD SCHEDULING TIMELINE */}
      <div className="p-6 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Grid-Aware Workload Scheduler Timeline</span>
            </h2>
            <p className="text-xs text-slate-400">
              Shift stateless batch processes (like ML inferences and backups) automatically to clean energy periods.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold font-sans">
              Optimize Schedule
            </span>
            <button
              id="workload-optimization-toggle-btn"
              type="button"
              onClick={toggleWorkloadShifting}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                workloadsShifted ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span 
                className={`absolute top-1 left-1 bg-slate-950 h-4 w-4 rounded-full transition-transform duration-350 ${
                  workloadsShifted ? 'translate-x-5 bg-white' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 24h Timeline bar visualization */}
        <div className="space-y-6">
          {/* Carbon Curve Bar */}
          <div className="relative">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 font-mono flex justify-between">
              <span>00:00 (Midnight)</span>
              <span>06:00</span>
              <span className="text-amber-500">12:00 (Solar Peak)</span>
              <span>18:00</span>
              <span className="text-rose-500">20:00 (Fossil Peak)</span>
              <span>24:00 (Midnight)</span>
            </div>
            
            {/* The intensity slider track */}
            <div className="w-full h-6 rounded-lg bg-gradient-to-r from-emerald-555/20 via-amber-500/20 to-rose-500/20 flex overflow-hidden border border-slate-800/80">
              <div className="w-1/4 h-full bg-emerald-500/20 border-r border-slate-805/50 flex items-center justify-center text-[9px] font-bold text-emerald-400 font-mono">110 g/kWh</div>
              <div className="w-1/4 h-full bg-emerald-500/30 border-r border-slate-805/50 flex items-center justify-center text-[9px] font-bold text-emerald-400 font-mono">95 g/kWh</div>
              <div className="w-1/4 h-full bg-amber-500/30 border-r border-slate-805/50 flex items-center justify-center text-[9px] font-bold text-amber-400 font-mono">310 g/kWh</div>
              <div className="w-1/4 h-full bg-rose-500/30 flex items-center justify-center text-[9px] font-bold text-rose-455/90 font-mono">480 g/kWh</div>
            </div>
          </div>

          {/* Workload Placements */}
          <div className="relative border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-4">
            <div className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
              Active Workload Scheduling Rows
            </div>

            {/* Row 1: ML Inference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="font-bold text-slate-200">ML Inference Batch Job (EC2)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500 font-sans">Schedule:</span>
                <span className={`px-2.5 py-1 rounded font-mono text-[10.5px] font-bold transition-all duration-500 ${
                  workloadsShifted 
                    ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/15 border border-rose-500/20 text-rose-450'
                }`}>
                  {workloadsShifted ? '13:00 (Eco Grid: 95g/kWh)' : '19:00 (Fossil Peak: 460g/kWh)'}
                </span>
              </div>
            </div>

            {/* Row 2: S3 Object Compression */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Log Archive Aggregation (S3)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500 font-sans">Schedule:</span>
                <span className={`px-2.5 py-1 rounded font-mono text-[10.5px] font-bold transition-all duration-500 ${
                  workloadsShifted 
                    ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/15 border border-rose-500/20 text-rose-455/90'
                }`}>
                  {workloadsShifted ? '02:00 (Eco Grid: 102g/kWh)' : '20:30 (Fossil Peak: 480g/kWh)'}
                </span>
              </div>
            </div>

            {/* Row 3: Reports Replication */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200">RDS Reports Database Replication</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500 font-sans">Schedule:</span>
                <span className={`px-2.5 py-1 rounded font-mono text-[10.5px] font-bold transition-all duration-500 ${
                  workloadsShifted 
                    ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/15 border border-rose-500/20 text-rose-455/90'
                }`}>
                  {workloadsShifted ? '04:00 (Eco Grid: 112g/kWh)' : '18:00 (Fossil Peak: 450g/kWh)'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 5. LIVE TELEMETRY & ACTIVITY FEED */}
      <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              {telemetryEnabled ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"></span>
              )}
            </span>
            <h2 className="font-sans font-semibold text-md text-slate-100 flex items-center gap-1.5">
              <span>Live Telemetry & Activity Feed</span>
              {telemetryEnabled && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded animate-pulse">
                  Streaming
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-405 font-sans">
              SSE Connection
            </span>
            {/* Toggle Switch */}
            <button
              id="telemetry-connection-toggle-btn"
              type="button"
              onClick={() => setTelemetryEnabled(!telemetryEnabled)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                telemetryEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span 
                className={`absolute top-0.5 left-0.5 bg-slate-950 h-4 w-4 rounded-full transition-transform ${
                  telemetryEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {telemetryEnabled ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Live Stats Graph - 7 cols */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Instantaneous Power */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Power Load</div>
                  <div className="text-lg font-extrabold text-slate-200 font-mono mt-1 flex items-baseline gap-1">
                    <span>{telemetryDataHistory[telemetryDataHistory.length - 1]?.instantaneousPowerKw || '12.48'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">kW</span>
                  </div>
                </div>
                
                {/* Instantaneous Carbon */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carbon flow rate</div>
                  <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1 flex items-baseline gap-1">
                    <span>{telemetryDataHistory[telemetryDataHistory.length - 1]?.carbonEmissionRateGps || '1.38'}</span>
                    <span className="text-[10px] text-emerald-500/75 font-normal">g/s</span>
                  </div>
                </div>

                {/* active workloads summary */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">active query load</div>
                  <div className="text-lg font-extrabold text-indigo-400 font-mono mt-1 flex items-baseline gap-1">
                    <span>{telemetryDataHistory[telemetryDataHistory.length - 1]?.activeWorkloads?.rdsConnections || '38'}</span>
                    <span className="text-[10px] text-slate-550 font-normal">reqs</span>
                  </div>
                </div>
              </div>

              {/* Dynamic scrolling graph */}
              <div className="flex-1 min-h-[90px] p-2 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50 font-mono">
                    Real-time carbon rate (g CO₂e/sec)
                  </span>
                </div>
                
                <div className="w-full h-20 mt-4 select-none">
                  {telemetryDataHistory.length > 0 ? (
                    <svg className="w-full h-full text-emerald-500/30 overflow-visible" viewBox={`0 0 ${rtWidth} ${rtHeight}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="rtChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {rtAreaPath && <path d={rtAreaPath} fill="url(#rtChartGradient)" className="transition-all duration-300" />}
                      {rtLinePath && <path d={rtLinePath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" className="transition-all duration-300" />}
                      
                      {/* Pulse point at the end */}
                      {rtPoints.length > 0 && (
                        <circle 
                          cx={rtPoints[rtPoints.length - 1].x} 
                          cy={rtPoints[rtPoints.length - 1].y} 
                          r={3.5} 
                          fill="#10b981" 
                          className="animate-pulse"
                        />
                      )}
                    </svg>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-500 italic">
                      Populating real-time buffer...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Events Stream - 5 cols */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Telemetry Log Stream
              </div>
              <div className="h-[148px] overflow-y-auto font-mono text-[9.5px] bg-slate-950 text-slate-300 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-left scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {liveEventsList.length === 0 ? (
                  <div className="text-slate-500 italic text-center pt-14">Awaiting telemetry logs...</div>
                ) : (
                  liveEventsList.map((evt) => {
                    const timeStr = new Date(evt.timestamp).toLocaleTimeString();
                    const colorClass = 
                      evt.type === 'warning' 
                        ? 'text-rose-450 font-bold' 
                        : evt.type === 'optimization' 
                        ? 'text-emerald-400 font-bold' 
                        : 'text-slate-350';
                    return (
                      <div key={evt.id} className="flex gap-1.5 leading-relaxed">
                        <span className="text-slate-500 shrink-0 font-sans">[{timeStr}]</span>
                        <span className={`${colorClass}`}>{evt.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
            <Activity className="w-8 h-8 text-slate-500 animate-pulse mb-2" />
            <p className="text-xs text-slate-400 font-sans font-medium">
              Telemetry Server Stream is currently offline.
            </p>
            <button
              id="activate-telemetry-panel-btn"
              onClick={() => setTelemetryEnabled(true)}
              className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
            >
              Initialize SSE Stream
            </button>
          </div>
        )}
      </div>

      {/* 6. INTERACTIVE EMISSION & ENERGY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carbon emissions over time - SVG line chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="font-sans font-semibold text-md text-slate-100 font-display">
                Carbon Emissions over time
              </h2>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/60 font-mono">
              Monthly Trend
            </span>
          </div>

          <div className="relative w-full h-[180px] mt-4">
            <svg 
              className="w-full h-full text-slate-700 select-none overflow-visible font-mono" 
              viewBox={`0 0 ${width} ${height}`}
              id="dashboard-emissions-line-chart-svg"
            >
              {/* Grid Lines */}
              <line x1={paddingLeft} y1={20} x2={width - paddingRight} y2={20} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={70} x2={width - paddingRight} y2={70} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={120} x2={width - paddingRight} y2={120} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="currentColor" strokeWidth={0.5} opacity={0.5} />

              {/* Y Axis text markers */}
              <text x={paddingLeft - 8} y={24} textAnchor="end" className="text-[10px] fill-slate-500 font-bold">{(maxVal * 0.9).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={74} textAnchor="end" className="text-[10px] fill-slate-500 font-bold">{(maxVal * 0.55).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={124} textAnchor="end" className="text-[10px] fill-slate-500 font-bold">{(maxVal * 0.2).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={height - paddingBottom + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-bold">0</text>

              {/* Axis Label */}
              <text x={10} y={12} className="text-[9px] font-bold text-amber-500 fill-amber-500 font-sans tracking-wide uppercase">kg CO₂e</text>

              {/* Gradient beneath curve */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-300" />

              {/* Plotted emission Line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={3.5} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-all duration-300"
              />

              {/* Point hover sensors / dots */}
              {points.map((pt, idx) => {
                const isHovered = hoveredLineIndex === idx;
                return (
                  <g key={idx}>
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isHovered ? 7 : 4.5} 
                      fill={isHovered ? '#10b981' : '#059669'} 
                      stroke={isHovered ? '#ffffff' : 'transparent'} 
                      strokeWidth={1.5} 
                      className="cursor-pointer transition-all duration-200" 
                      onMouseEnter={() => setHoveredLineIndex(idx)}
                      onMouseLeave={() => setHoveredLineIndex(null)}
                    />
                    {/* Month Label */}
                    <text 
                      x={pt.x} 
                      y={height - 7} 
                      textAnchor="middle" 
                      className={`text-[10px] font-sans font-semibold transition-colors duration-150 ${isHovered ? 'fill-emerald-400 font-bold' : 'fill-slate-500'}`}
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip */}
            {hoveredLineIndex !== null && points[hoveredLineIndex] && (
              <div 
                className="absolute bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2.5 shadow-xl text-left font-sans z-25 pointer-events-none transition-all"
                style={{ 
                  left: `${points[hoveredLineIndex].x - 60}px`,
                  top: `${points[hoveredLineIndex].y - 75}px`
                }}
              >
                <div className="text-[10px] font-bold text-amber-500 tracking-wide uppercase">{points[hoveredLineIndex].date}</div>
                <div className="text-xs font-bold mt-0.5">{points[hoveredLineIndex].emissionsKg.toFixed(1)} kg CO₂</div>
                <div className="text-[9px] text-slate-450 mt-0.5">Energy: {points[hoveredLineIndex].energyKwh.toLocaleString()} kWh</div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-sans leading-none text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Current rate of emissions generated has curbed by <b>{carbonReducedKg.toFixed(0)} kg CO₂</b> this month!</span>
            </span>
          </div>
        </div>

        {/* Resource energy consumption - SVG Interactive Donut Chart */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="font-sans font-semibold text-md text-slate-100">
                Energy Usage by Sector
              </h2>
            </div>

            {/* SVG Donut Layout */}
            <div className="relative flex justify-center py-3">
              <svg 
                className="w-40 h-40 select-none overflow-visible" 
                viewBox="0 0 100 100"
                id="dashboard-energy-donut-chart-svg"
              >
                {/* Background full circle */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="currentColor" className="text-slate-800" strokeWidth="12" />

                {/* Concentric slices drawing */}
                {donutData.map((slice, idx) => {
                  const strokeWidth = hoveredDonutIndex === idx ? 15 : 12;
                  const radius = 38;
                  const circleCircumference = 2 * Math.PI * radius;
                  const strokeLength = (slice.percentage / 100) * circleCircumference;
                  const strokeOffset = circleCircumference - ((accumulatedPercentage / 100) * circleCircumference);
                  
                  // Increments for sequential positioning
                  accumulatedPercentage += slice.percentage;

                  return (
                    <circle 
                      key={slice.type}
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke={slice.stroke} 
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${strokeLength} ${circleCircumference}`}
                      strokeDashoffset={strokeOffset}
                      transform="rotate(-90 50 50)"
                      className="cursor-pointer transition-all duration-350 origin-center"
                      onMouseEnter={() => setHoveredDonutIndex(idx)}
                      onMouseLeave={() => setHoveredDonutIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Central text overlay inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredDonutIndex !== null && donutData[hoveredDonutIndex] ? (
                  <>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                      {donutData[hoveredDonutIndex].type}
                    </span>
                    <span className="text-lg font-bold text-slate-100 leading-none mt-1">
                      {donutData[hoveredDonutIndex].percentage}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-405 mt-0.5 font-bold">
                      {donutData[hoveredDonutIndex].value.toLocaleString()} kWh
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-sans">Total</span>
                    <span className="text-lg font-extrabold text-slate-100 leading-none mt-1">
                      {totalEnergy.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-450 mt-0.5">kWh/Mo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            {donutData.map((slice, index) => (
              <div 
                key={slice.type} 
                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${hoveredDonutIndex === index ? 'bg-slate-805/50' : ''}`}
                onMouseEnter={() => setHoveredDonutIndex(index)}
                onMouseLeave={() => setHoveredDonutIndex(null)}
              >
                <span className={`w-2 h-2 rounded ${slice.bg}`} />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-350 leading-none">{slice.type}</span>
                  <span className="text-[9px] font-mono text-slate-500 leading-normal mt-0.5">{slice.percentage}% ({slice.value} kWh)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. AWS REGION COMPARISON TABLE & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* High Impact Recommendations panel */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-505 animate-pulse" />
              <h2 className="font-sans font-semibold text-md text-slate-100">
                High Impact AI Recommendations
              </h2>
            </div>
            <button
              id="goto-all-recommendations-btn"
              onClick={() => setActiveTab('recommendations')}
              className="text-xs font-semibold text-amber-500 hover:text-amber-450 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div 
                key={rec.id}
                className={`p-4 rounded-lg border transition-all ${
                  rec.applied 
                    ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
                id={`recent-rec-item-${rec.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
                        rec.priority === 'High' 
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                          : rec.priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-450 border border-amber-500/20'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Target: {rec.resourceType}
                      </span>
                    </div>
                    <h3 className={`text-xs font-bold font-sans ${rec.applied ? 'line-through text-slate-550' : 'text-slate-200'}`}>
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {/* Quick stats and toggle action */}
                  <div className="shrink-0 flex items-center sm:flex-col justify-between sm:justify-start gap-4 sm:gap-2.5 sm:text-right">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">Achieves</div>
                      <div className="text-xs font-bold text-emerald-400">-{rec.co2ReductionKg} kg CO₂</div>
                      <div className="text-[10.5px] font-medium text-amber-505">+${rec.costSavingsUsd}/Mo</div>
                    </div>
                    
                    {rec.applied ? (
                      <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-lg text-[10px] font-bold tracking-wider uppercase font-sans border border-emerald-500/20">
                        Applied ✓
                      </span>
                    ) : (
                      <button
                        id={`dashboard-apply-rec-${rec.id}`}
                        onClick={() => applyRecommendation(rec.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md text-[10px] font-extrabold shadow-sm transition-all cursor-pointer"
                      >
                        Quick Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global grid intensity regions table */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
              <Globe className="w-5 h-5 text-amber-500" />
              <h2 className="font-sans font-semibold text-md text-slate-100">
                Green Grid Carbon Intensity
              </h2>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal mb-4 font-sans">
              AWS operates in multiple grids globally. Target environments positioned in green regions emit up to <b>95% less carbon footprint</b>.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
                <span>AWS Region</span>
                <span>Carbon Factor</span>
              </div>
              
              <div className="space-y-2">
                
                {/* Sweden (Stockholm) - super clean */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🇸🇪</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-200">eu-north-1</span>
                      <span className="text-[10px] text-slate-500 font-sans leading-none">Stockholm (Hydro/Wind)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">12 g/kWh</span>
                    <span className="block text-[8px] text-emerald-400 font-semibold uppercase mt-0.5">Ultra Green</span>
                  </div>
                </div>

                {/* Oregon - very green */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🌲</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-200">us-west-2</span>
                      <span className="text-[10px] text-slate-500 font-sans leading-none">Oregon (Hydro/Solar)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">110 g/kWh</span>
                    <span className="block text-[8px] text-emerald-400 font-semibold uppercase mt-0.5">Excellent</span>
                  </div>
                </div>

                {/* N VA - coal-heavy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🇺🇸</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-200">us-east-1</span>
                      <span className="text-[10px] text-slate-500 font-sans leading-none">N. Virginia (Fossil)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-rose-500/10 text-rose-450 border border-rose-500/20 px-1.5 py-0.5 rounded font-extrabold">370 g/kWh</span>
                    <span className="block text-[8px] text-rose-550 font-semibold uppercase mt-0.5">Fossil Heavy</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <button
            id="report-tab-quick-relocate-btn"
            onClick={() => setActiveTab('reports')}
            className="mt-4 w-full text-center py-2 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg text-xs font-bold text-slate-405 transition-colors cursor-pointer"
          >
            Compare Regional Footprint
          </button>
        </div>

      </div>

    </div>
  );
}
