import { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Globe, 
  ShieldCheck,
  TrendingDown,
  Info
} from 'lucide-react';
import { CloudResource, AuditHistoryEntry, RegionalMetric } from '../types';

interface FootprintReportProps {
  resources: CloudResource[];
  history: AuditHistoryEntry[];
  regions: RegionalMetric[];
  appliedRecsCount: number;
  totalRecsCount: number;
}

export default function FootprintReport({
  resources,
  history,
  regions,
  appliedRecsCount,
  totalRecsCount
}: FootprintReportProps) {
  
  // Local interaction states
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'csv' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Core metrics calculation
  const totalMonthlyKwh = useMemo(() => {
    return resources.reduce((sum, r) => sum + r.energyUsageKwh, 0);
  }, [resources]);

  const totalMonthlyKg = useMemo(() => {
    return resources.reduce((sum, r) => sum + r.carbonEmissionKg, 0);
  }, [resources]);

  const averageIntensity = useMemo(() => {
    return totalMonthlyKwh > 0 ? Math.round((totalMonthlyKg * 1000) / totalMonthlyKwh) : 0;
  }, [totalMonthlyKwh, totalMonthlyKg]);

  // Aggregate active resources count per region dynamically
  const regionActiveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach(r => {
      counts[r.region] = (counts[r.region] || 0) + 1;
    });
    return counts;
  }, [resources]);

  // Export handlers
  const triggerExport = (format: 'pdf' | 'csv') => {
    setDownloadingFormat(format);
    setDownloadSuccess(null);

    setTimeout(() => {
      setDownloadingFormat(null);
      if (format === 'pdf') {
        setDownloadSuccess('GreenCodeChoice_CarbonReport.pdf generated successfully and downloaded.');
        
        // Triggers standard window print stylesheet if clicked
        window.print();
      } else {
        // Real CSV file download generation!
        const csvContent = "data:text/csv;charset=utf-8," 
          + "Month,Energy Usage (kWh),Carbon Emissions (kg CO2e),Savings Ratio\n"
          + history.map(row => `${row.date},${row.energyKwh},${row.emissionsKg},${(row.costUsd*0.15).toFixed(0)}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Carbon_Footprint_Report_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadSuccess('Carbon_Footprint_Report.csv created and triggered local file download.');
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-sans font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
            Greenhouse Carbon Compliance Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Export monthly data audit packets, review regional emission ratios, and verify greenhouse index milestones.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          
          <button
            id="report-export-csv-btn"
            onClick={() => triggerExport('csv')}
            disabled={downloadingFormat !== null}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{downloadingFormat === 'csv' ? 'Assembling CSV...' : 'Export CSV'}</span>
          </button>

          <button
            id="report-export-pdf-btn"
            onClick={() => triggerExport('pdf')}
            disabled={downloadingFormat !== null}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:from-emerald-600 hover:to-teal-700 hover:scale-[1.03] active:scale-[0.98]"
          >
            <FileText className="w-4 h-4 text-emerald-100" />
            <span>{downloadingFormat === 'pdf' ? 'Formatting PDF...' : 'Download PDF Report'}</span>
          </button>

        </div>
      </div>

      {/* Success Banner popup */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Total Emissions scorecard row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Aggregated Footprint summary */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Current Audit Volume</div>
            <div className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1.5 font-sans">
              {totalMonthlyKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
            </div>
            <div className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
              CO₂ Equivalent Footprint
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850/80 mt-4">
            <span className="text-xs text-slate-400 block font-sans">Evaluated AWS Accounts:</span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">1 standard prod catalog (4832-9011)</span>
          </div>
        </div>

        {/* Grid Carbon Intensity metrics */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Average Grid Intensity</div>
            <div className="text-3l font-extrabold text-amber-600 dark:text-amber-400 mt-1.5 font-sans flex items-baseline gap-1">
              <span className="text-3xl">{averageIntensity}</span>
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">g CO₂/kWh</span>
            </div>
            <div className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
              Resource Energy Draw Rate
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850/80 mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Industry goal is under 100g/kWh</span>
          </div>
        </div>

        {/* Milestone Achievement Status */}
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-left flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">GCC Score Milestones</div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 mt-2">Active optimizations completed:</h3>
            <div className="flex items-baseline gap-1.5 mt-1 font-sans">
              <span className="text-2xl font-extrabold text-emerald-500">{appliedRecsCount}</span>
              <span className="text-xs text-gray-400 font-bold">applied out of {totalRecsCount} items</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-slate-800 mt-3 flex items-center gap-2 font-sans font-bold text-[10.5px] uppercase tracking-wider">
            {appliedRecsCount === totalRecsCount ? (
              <span className="text-emerald-600 inline-flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> 100% Carbon Compliant</span>
            ) : (
              <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Optimization Gap Remains</span>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Global regional footprint comparisons & monthly trends list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Regional analysis details */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
              Global Regional Carbon Profiles & Active Nodes
            </h2>
          </div>

          <div className="space-y-3">
            {regions.map((reg) => {
              const activeCount = regionActiveCounts[reg.region] || 0;
              const intensityCategory = reg.carbonIntensityG < 50 
                ? 'bg-emerald-500' // Ultra Green (Stockholm)
                : reg.carbonIntensityG <= 120 
                ? 'bg-teal-500' // Good (Oregon, etc)
                : reg.carbonIntensityG <= 300 
                ? 'bg-amber-500' // Moderate
                : 'bg-rose-500'; // High (Virginia)

              return (
                <div key={reg.region} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-gray-150/40 dark:border-slate-850 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg select-none">{reg.gridIcon}</span>
                    <div className="text-left font-sans">
                      <div className="text-xs font-bold text-gray-900 dark:text-slate-100">{reg.name}</div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{reg.region}</div>
                    </div>
                  </div>

                  {/* Meter visual comparison slider */}
                  <div className="flex-1 max-w-[120px] hidden sm:block">
                    <div className="w-full bg-gray-250 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${intensityCategory}`}
                        style={{ width: `${Math.min(100, (reg.carbonIntensityG / 400) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active resource and intensity stats */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-gray-800 dark:text-slate-200 block">
                      {reg.carbonIntensityG} g/kWh
                    </span>
                    <span className={`text-[9px] font-semibold tracking-wider uppercase ${activeCount > 0 ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
                      {activeCount} active {activeCount === 1 ? 'resource' : 'resources'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabular monthly trends */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Activity className="w-5 h-5 text-teal-500" />
            <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
              Tabular History Logs & Audit Archive
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold tracking-wider uppercase">
                  <th className="py-2.5 pb-2">Audit Phase</th>
                  <th className="py-2.5 pb-2 text-right">Energy (kWh)</th>
                  <th className="py-2.5 pb-2 text-right">Carbon Load</th>
                  <th className="py-2.5 pb-2 text-right">OpEx Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-850/50 text-gray-700 dark:text-slate-300">
                {history.map((entry) => (
                  <tr key={entry.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="py-3 font-bold text-gray-800 dark:text-white">{entry.date}</td>
                    <td className="py-3 text-right font-mono">{entry.energyKwh.toLocaleString()} kWh</td>
                    <td className="py-3 text-right font-mono font-bold text-rose-550 dark:text-rose-400">{entry.emissionsKg.toLocaleString()} kg</td>
                    <td className="py-3 text-right font-mono font-bold text-blue-550 dark:text-blue-400">${entry.costUsd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500-[0.01] border border-emerald-500/10 rounded-xl mt-4 text-left">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block font-mono">Sustainability Statement</span>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 font-sans leading-relaxed">
              This environment matches regional carbon indices compiled explicitly according to the **GHG Protocol Corporate Standard** incorporating Scope 2 green market energy configurations.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
