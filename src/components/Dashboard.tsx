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
  Globe
} from 'lucide-react';
import { CloudResource, AIRecommendation, AuditHistoryEntry } from '../types';

interface DashboardProps {
  resources: CloudResource[];
  recommendations: AIRecommendation[];
  history: AuditHistoryEntry[];
  applyRecommendation: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({
  resources,
  recommendations,
  history,
  applyRecommendation,
  setActiveTab
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

  // 5. Sustainability score (increases as pending recommendations are applied!)
  const initialBaseScore = 65;
  const targetDiff = 35;
  const ratioApplied = recommendations.length > 0 ? (appliedRecommendations.length / recommendations.length) : 0;
  const dynamicSustainabilityScore = Math.min(100, initialBaseScore + Math.round(ratioApplied * targetDiff));

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

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
            Sustainability Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Real-time AWS footprint analyzer powered by AI carbon intelligence engines.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
            Scanning Active AWS Grid
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI: Total Footprint */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">Total Carbon</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-2xl text-slate-900 dark:text-white">
              {currentTotalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">kg CO₂</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-sans">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{carbonReducedKg > 0 ? `-${carbonReducedKg.toFixed(0)}kg reduced` : 'Optimizations pending'}</span>
          </div>
        </div>

        {/* KPI: Cost Savings */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">Cost Savings</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-650 dark:text-blue-400 rounded-md">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-2xl text-slate-900 dark:text-white">
              ${totalCostSavingsVal.toFixed(0)}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">saved</span>
          </div>
          <p className="mt-2.5 text-[11px] text-gray-500 dark:text-slate-400 truncate">
            {potentialSavingsVal > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">${potentialSavingsVal.toFixed(0)} more potential</span>
            ) : (
              <span className="text-emerald-500 font-semibold">Maxized efficiency!</span>
            )}
          </p>
        </div>

        {/* KPI: Carbon Reduction percentage */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">CO₂ Reduction</span>
            <div className="p-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-md">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-2xl text-slate-900 dark:text-white">
              {carbonReducedPct}%
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">achieved</span>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
            Compared to standard baseline.
          </p>
        </div>

        {/* KPI: Active AWS Resources */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">Resources</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-2xl text-slate-900 dark:text-white">
              {activeResourcesCount}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">connected</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-rose-650 font-semibold">{pendingOptimizationsCount}</span>
            <span>pending optimization</span>
          </div>
        </div>

        {/* KPI: AI Sustainability Score */}
        <div className="p-5 rounded-xl bg-emerald-50/40 dark:bg-emerald-500/[0.03] border border-emerald-200 dark:border-emerald-800/70 shadow-sm relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">AI Score</span>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-3xl text-emerald-700 dark:text-emerald-400 animate-pulse">
              {dynamicSustainabilityScore}
            </span>
            <span className="text-xs font-sans font-medium text-emerald-750/70 dark:text-emerald-400/70">/100</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${dynamicSustainabilityScore}%` }}
            />
          </div>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carbon emissions over time - SVG line chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
                Carbon Emissions over time
              </h2>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded">
              Monthly Trend
            </span>
          </div>

          <div className="relative w-full h-[180px] mt-4">
            <svg 
              className="w-full h-full text-slate-300 dark:text-slate-700 select-none overflow-visible" 
              viewBox={`0 0 ${width} ${height}`}
              id="dashboard-emissions-line-chart-svg"
            >
              {/* Grid Lines */}
              <line x1={paddingLeft} y1={20} x2={width - paddingRight} y2={20} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={70} x2={width - paddingRight} y2={70} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={120} x2={width - paddingRight} y2={120} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
              <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="currentColor" strokeWidth={0.5} opacity={0.5} />

              {/* Y Axis text markers */}
              <text x={paddingLeft - 8} y={24} textAnchor="end" className="text-[10px] font-mono fill-gray-400 dark:fill-slate-500 font-bold">{(maxVal * 0.9).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={74} textAnchor="end" className="text-[10px] font-mono fill-gray-400 dark:fill-slate-500 font-bold">{(maxVal * 0.55).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={124} textAnchor="end" className="text-[10px] font-mono fill-gray-400 dark:fill-slate-500 font-bold">{(maxVal * 0.2).toFixed(0)}</text>
              <text x={paddingLeft - 8} y={height - paddingBottom + 3} textAnchor="end" className="text-[10px] font-mono fill-gray-400 dark:fill-slate-500 font-bold">0</text>

              {/* Axis Label */}
              <text x={10} y={12} className="text-[9px] font-bold text-emerald-500/80 fill-emerald-500 font-sans tracking-wide uppercase">kg CO₂e</text>

              {/* Gradient beneath curve */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
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
                      fill={isHovered ? '#059669' : '#10b981'} 
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
                      className={`text-[10px] font-sans font-semibold transition-colors duration-150 ${isHovered ? 'fill-emerald-500 font-bold' : 'fill-gray-400 dark:fill-slate-500'}`}
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip box rendered above the SVG layer */}
            {hoveredLineIndex !== null && points[hoveredLineIndex] && (
              <div 
                className="absolute bg-slate-950/95 border border-slate-800 text-white rounded-lg p-2.5 shadow-xl text-left font-sans z-20 pointer-events-none transition-all"
                style={{ 
                  left: `${points[hoveredLineIndex].x - 60}px`,
                  top: `${points[hoveredLineIndex].y - 75}px`
                }}
              >
                <div className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase">{points[hoveredLineIndex].date}</div>
                <div className="text-xs font-bold mt-0.5">{points[hoveredLineIndex].emissionsKg.toFixed(1)} kg CO₂</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Energy: {points[hoveredLineIndex].energyKwh.toLocaleString()} kWh</div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/65 rounded-xl flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-sans leading-none text-slate-500 dark:text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Current rate of emissions generated has curbed by <b>{carbonReducedKg.toFixed(0)} kg CO₂</b> this month!</span>
            </span>
          </div>
        </div>

        {/* Resource energy consumption - SVG Interactive Donut Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
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
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="12" />

                {/* Concentric slices drawing */}
                {donutData.map((slice, idx) => {
                  const strokeWidth = hoveredDonutIndex === idx ? 15 : 12;
                  const radius = 38;
                  const circumference = 22 * 2 * Math.PI; // wait, r=38, circumference = 2 * Math.PI * 38 = 238.76
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
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider uppercase">
                      {donutData[hoveredDonutIndex].type}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                      {donutData[hoveredDonutIndex].percentage}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {donutData[hoveredDonutIndex].value.toLocaleString()} kWh
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider uppercase">Total</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-white leading-none">
                      {totalEnergy.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-500">kWh/Mo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Side Legenda display for clarity */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-gray-150 dark:border-slate-800/80">
            {donutData.map((slice, index) => (
              <div 
                key={slice.type} 
                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${hoveredDonutIndex === index ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                onMouseEnter={() => setHoveredDonutIndex(index)}
                onMouseLeave={() => setHoveredDonutIndex(null)}
              >
                <span className={`w-2.5 h-2.5 rounded ${slice.bg}`} />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-none">{slice.type}</span>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 leading-normal">{slice.percentage}% ({slice.value} kWh)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Highlights: Recent Recommendations & Green Regions comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* High Impact Recommendations panel */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
                High Impact AI Recommendations
              </h2>
            </div>
            <button
              id="goto-all-recommendations-btn"
              onClick={() => setActiveTab('recommendations')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
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
                    ? 'bg-emerald-500/5 dark:bg-emerald-500-[0.02] border-emerald-555/20 opacity-65'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:shadow-sm'
                }`}
                id={`recent-rec-item-${rec.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
                        rec.priority === 'High' 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400' 
                          : rec.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-slate-500">
                        Target: {rec.resourceType}
                      </span>
                    </div>
                    <h3 className={`text-xs font-bold font-sans ${rec.applied ? 'line-through text-gray-500' : 'text-gray-950 dark:text-slate-100'}`}>
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {/* Quick stats and toggle action */}
                  <div className="shrink-0 flex items-center sm:flex-col justify-between sm:justify-start gap-4 sm:gap-2.5 sm:text-right">
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-500">Achieves</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">-{rec.co2ReductionKg} kg CO₂</div>
                      <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400">+${rec.costSavingsUsd}/Mo</div>
                    </div>
                    
                    {rec.applied ? (
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold tracking-wider uppercase font-sans">
                        Applied ✓
                      </span>
                    ) : (
                      <button
                        id={`dashboard-apply-rec-${rec.id}`}
                        onClick={() => applyRecommendation(rec.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-sm hover:shadow transition-all"
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

        {/* Global grid intensity warning */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Globe className="w-5 h-5 text-emerald-500" />
              <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
                Green Grid Carbon Intensity
              </h2>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal mb-4 font-sans">
              AWS operates in multiple grids globally. Target environments positioned in green sectors emit up to <b>95% less greenhouse footprint</b>.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 tracking-wider">
                <span>AWS Region</span>
                <span>Carbon Factor</span>
              </div>
              
              <div className="space-y-2">
                
                {/* Sweden (Stockholm) - super clean */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500-[0.02] border border-emerald-500/15">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🇸🇪</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">eu-north-1</span>
                      <span className="text-[10px] text-slate-400 font-sans leading-none">Stockholm (Hydro/Wind)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400 px-1.5 py-0.5 rounded font-extrabold">12 g/kWh</span>
                    <span className="block text-[8px] text-emerald-600 font-semibold uppercase mt-0.5">Ultra Green</span>
                  </div>
                </div>

                {/* Oregon - very green */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500-[0.01] border border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🌲</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">us-west-2</span>
                      <span className="text-[10px] text-slate-400 font-sans leading-none">Oregon (Hydro/Solar)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-emerald-50 text-emerald-800 dark:bg-emerald-400/5 dark:text-emerald-400/90 px-1.5 py-0.5 rounded font-extrabold">110 g/kWh</span>
                    <span className="block text-[8px] text-emerald-500 font-semibold uppercase mt-0.5">Excellent</span>
                  </div>
                </div>

                {/* N VA - coal-heavy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🇺🇸</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">us-east-1</span>
                      <span className="text-[10px] text-slate-400 font-sans leading-none">N. Virginia (Fossil average)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono leading-none bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-400 px-1.5 py-0.5 rounded font-extrabold">370 g/kWh</span>
                    <span className="block text-[8px] text-rose-500 font-semibold uppercase mt-0.5">Fossil Heavy</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <button
            id="report-tab-quick-relocate-btn"
            onClick={() => setActiveTab('reports')}
            className="mt-4 w-full text-center py-2 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-300 transition-colors"
          >
            Compare Regional Footprint
          </button>
        </div>

      </div>

    </div>
  );
}
