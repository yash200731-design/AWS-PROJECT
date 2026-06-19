import { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { CloudResource, ResourceType } from '../types';

interface ResourceAnalysisProps {
  resources: CloudResource[];
  applyQuickOptimisation: (resourceId: string, reductionKg: number, savingsUsd: number) => void;
}

type SortField = 'name' | 'type' | 'energyUsageKwh' | 'carbonEmissionKg' | 'monthlyCost' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ResourceAnalysis({ resources, applyQuickOptimisation }: ResourceAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('carbonEmissionKg');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedResource, setSelectedResource] = useState<CloudResource | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // default to descending for numbers
    }
  };

  // Filter and sort computation
  const filteredAndSortedResources = useMemo(() => {
    return resources
      .filter((res) => {
        const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              res.region.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'All' || res.type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];

        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortOrder === 'asc' 
            ? fieldA.localeCompare(fieldB) 
            : fieldB.localeCompare(fieldA);
        }

        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return sortOrder === 'asc' 
            ? fieldA - fieldB 
            : fieldB - fieldA;
        }

        return 0;
      });
  }, [resources, searchTerm, selectedType, sortField, sortOrder]);

  const stats = useMemo(() => {
    const activeList = filteredAndSortedResources;
    return {
      count: activeList.length,
      totalKwh: activeList.reduce((sum, r) => sum + r.energyUsageKwh, 0),
      totalKg: activeList.reduce((sum, r) => sum + r.carbonEmissionKg, 0),
      totalCost: activeList.reduce((sum, r) => sum + r.monthlyCost, 0)
    };
  }, [filteredAndSortedResources]);

  // Icons corresponding to cloud segments
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'EC2': return <Cpu className="w-4 h-4 text-emerald-500" />;
      case 'Lambda': return <Sparkles className="w-4 h-4 text-rose-500" />;
      case 'S3': return <Layers className="w-4 h-4 text-amber-500" />;
      case 'RDS': return <Database className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="font-sans font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
          Active Resource Footprint Analyzer
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Drill down into structural AWS items. Sort, search, and identify hot spots of grid emissions of your active compute, serverless nodes, storage buckets, and DB clusters.
        </p>
      </div>

      {/* Aggregate Metric Highlights for Selected Subsectors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="text-left py-1">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase font-sans">Filtered Resource Segment</div>
          <div className="text-lg font-bold text-gray-800 dark:text-slate-100">{selectedType} Units</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{stats.count} resources match scope</div>
        </div>
        <div className="text-left border-l border-gray-200 dark:border-slate-800 pl-4 py-1">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase font-sans">Sum of Energy Consumption</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Zap className="w-4 h-4 shrink-0" />
            <span>{stats.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Average monthly rate</div>
        </div>
        <div className="text-left border-l border-gray-200 dark:border-slate-800 pl-4 py-1">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase font-sans">Calculated Greenhouse Load</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span>{stats.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Grid carbon factor integrated</div>
        </div>
        <div className="text-left border-l border-gray-200 dark:border-slate-800 pl-4 py-1">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase font-sans">Estimated Cost Overhead</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>${stats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Excludes data egress credits</div>
        </div>
      </div>

      {/* Grid Filters Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-gray-405 dark:text-slate-500" />
          <input
            id="resource-filter-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Resource Name, or AWS Region..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-lg outline-none transition-all"
          />
        </div>

        {/* Category segment switches */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'EC2', 'Lambda', 'S3', 'RDS'] as const).map((type) => (
            <button
              id={`filter-resource-type-btn-${type}`}
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === type
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="resource-analysis-main-table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/20 text-xs font-bold text-gray-500 dark:text-slate-400">
                <th className="py-4 px-5">
                  <button 
                    id="sort-resource-name-hdr"
                    onClick={() => handleSort('name')} 
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Resource ID & Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4">
                  <button 
                    id="sort-resource-type-hdr"
                    onClick={() => handleSort('type')} 
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Type</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4">AWS Region</th>
                <th className="py-4 px-4 text-right">
                  <button 
                    id="sort-resource-energy-hdr"
                    onClick={() => handleSort('energyUsageKwh')} 
                    className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Energy Usage</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-right">
                  <button 
                    id="sort-resource-carbon-hdr"
                    onClick={() => handleSort('carbonEmissionKg')} 
                    className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Grid CO₂ Impact</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-4 text-right">
                  <button 
                    id="sort-resource-cost-hdr"
                    onClick={() => handleSort('monthlyCost')} 
                    className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Monthly Cost</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-4 px-5">
                  <button 
                    id="sort-resource-status-hdr"
                    onClick={() => handleSort('status')} 
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-wider"
                  >
                    <span>Optimization Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-sm">
              {filteredAndSortedResources.length > 0 ? (
                filteredAndSortedResources.map((res) => {
                  const isPending = res.status !== 'optimized';
                  return (
                    <tr 
                      key={res.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-950/20 transition-colors group ${selectedResource?.id === res.id ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' : ''}`}
                    >
                      <td className="py-4 px-5 font-sans">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            {res.name}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                            {res.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded">
                            {getResourceIcon(res.type)}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider font-mono">
                            {res.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-mono font-bold text-gray-650 bg-gray-100 dark:bg-slate-850 dark:text-slate-300 px-2 py-1 rounded">
                          {res.region}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-gray-800 dark:text-slate-200">
                        {res.energyUsageKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] text-gray-450 dark:text-slate-550 font-normal">kWh</span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-rose-500 dark:text-rose-400">
                        {res.carbonEmissionKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">kg CO₂e</span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-gray-800 dark:text-slate-200">
                        ${res.monthlyCost.toFixed(2)}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-between gap-2">
                          {res.status === 'optimized' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-sans">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Optimized</span>
                            </span>
                          ) : res.status === 'idle_warning' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 font-sans">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>100% IDLE!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 font-sans">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Unoptimized</span>
                            </span>
                          )}

                          {isPending && res.suggestion && (
                            <button
                              id={`resource-show-suggestion-btn-${res.id}`}
                              onClick={() => setSelectedResource(selectedResource?.id === res.id ? null : res)}
                              className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-150 dark:hover:bg-slate-800 rounded transition-all"
                              title="Show Optimization Insight"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-5 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 dark:text-slate-700 mb-2" />
                      <p className="font-semibold text-gray-500">No matching active resources found.</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting the segment filters or adjusting your search term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Drawer Details section for suggestions details */}
      {selectedResource && selectedResource.suggestion && (
        <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-500/[0.03] border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100/60 text-amber-700 dark:text-amber-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">AI Optimizer Insight</div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 mt-0.5">Recommended action for: <span className="font-mono text-[11.5px] font-medium text-amber-700 dark:text-amber-300">{selectedResource.name}</span></h4>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">{selectedResource.suggestion}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 select-none md:self-center">
            <button
              id={`resource-action-dismiss-suggestion-btn-${selectedResource.id}`}
              onClick={() => setSelectedResource(null)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Dismiss
            </button>
            <button
              id={`resource-apply-optimized-btn-${selectedResource.id}`}
              onClick={() => {
                // Apply a simple visual mock optimization
                const savedCo2 = Math.round(selectedResource.carbonEmissionKg * 0.45);
                const savedUsd = Math.round(selectedResource.monthlyCost * 0.25);
                applyQuickOptimisation(selectedResource.id, savedCo2, savedUsd);
                setSelectedResource(null);
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md transition-all shadow-sm"
            >
              Apply Optimization
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
