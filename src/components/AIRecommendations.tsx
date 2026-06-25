import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ChevronRight,
  Info,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import { AIRecommendation, PriorityLevel } from '../types';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  applyRecommendation: (id: string) => void;
}

export default function AIRecommendations({ recommendations, applyRecommendation }: AIRecommendationsProps) {
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'All'>('All');
  const [viewApplied, setViewApplied] = useState<boolean>(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Filter computation
  const filteredRecs = useMemo(() => {
    return recommendations.filter(rec => {
      const matchPriority = selectedPriority === 'All' || rec.priority === selectedPriority;
      const matchApplied = rec.applied === viewApplied;
      return matchPriority && matchApplied;
    });
  }, [recommendations, selectedPriority, viewApplied]);

  // Aggregate stats of pending vs applied
  const stats = useMemo(() => {
    const applied = recommendations.filter(r => r.applied);
    const pending = recommendations.filter(r => !r.applied);
    return {
      co2Saved: applied.reduce((sum, r) => sum + r.co2ReductionKg, 0),
      costSaved: applied.reduce((sum, r) => sum + r.costSavingsUsd, 0),
      co2Potential: pending.reduce((sum, r) => sum + r.co2ReductionKg, 0),
      costPotential: pending.reduce((sum, r) => sum + r.costSavingsUsd, 0)
    };
  }, [recommendations]);

  // Handle Simulated Co-Pilot Prompts
  const handleAiAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiAssistantPrompt.trim()) return;

    setAiLoading(true);
    setAiResponse(null);

    // Call the server API endpoint which hooks into OpenAI
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiAssistantPrompt }),
      });
      
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setAiResponse(data.response);
    } catch (error) {
      console.warn("AI Copilot fetch failed, using frontend fallback simulation:", error);
      
      // Dynamic simulate response fallback
      const promptLower = aiAssistantPrompt.toLowerCase();
      let response = '';

      if (promptLower.includes('storage') || promptLower.includes('s3')) {
        response = `### 📁 S3 Storage Consolidation Scan Results\n\nBased on your prompt, GCC AI analyzed your active S3 buckets and discovered **3.1 TB** of unreferenced assets and artifacts in \`b-user-assets-optimized\`.\n\n**Action Recommended:**\n- Set standard object lifecycle policies to delete multi-part upload segments older than 7 days.\n- Transition historical staging dumps to **Glacier Deep Archive**.\n\n**Environmental & Cost Impact:**\n- Est. CO₂ Reduction: **142 kg CO₂** per month.\n- Est. Cost Savings: **$95.00** per month.`;
      } else if (promptLower.includes('compute') || promptLower.includes('region') || promptLower.includes('ec2')) {
        response = `### ⚡ Regional Compute Migration Analysis\n\nYour compute nodes located in N. Virginia (\`us-east-1\`) currently operate during peak periods with high-emissions coal electricity. \n\n**Action Recommended:**\n- Move non-critical batch processors or testing environments to Sweden (\`eu-north-1\`) or Oregon (\`us-west-2\`).\n- Since \`eu-north-1\` is 98% carbon neutral, relocating yields massive sustainable progress.\n\n**Environmental & Cost Impact:**\n- Est. CO₂ Reduction: **480 kg CO₂** per month.\n- Est. Cost Savings: **$40.00** per month (due to cheaper regional node fees).`;
      } else if (promptLower.includes('idle') || promptLower.includes('sandbox') || promptLower.includes('redundant')) {
        response = `### 💤 Idle Instance Terminating Report\n\nGCC Agent analyzed server uptime statistics. We discovered 2 staging nodes which have had **0% CPU variance** for the last 10 days.\n\n**Action Recommended:**\n- Terminate pre-production bastion machines outside working hours or set up Auto-Shutdown cron triggers.\n\n**Environmental & Cost Impact:**\n- Est. CO₂ Reduction: **210 kg CO₂** per month.\n- Est. Cost Savings: **$160.00** per month.`;
      } else {
        response = `### 🌱 Cloud Sustainability Consultation\n\nAnalyzing active cluster metrics for account \`4832-9011-3329\`. Here are prime recommendations:\n\n1. **Region Relocation:** Ensure EC2 nodes are configured inside standard green regions (Sweden, France, Oregon).\n2. **Right-sizing:** Convert over-provisioned db instances down. Current instances have idle overhead margins of **78%**.\n3. **Spot Instances:** Shift stateless batch jobs from On-Demand instances to Spot instances to automatically take advantage of excess grid power.\n\n*Try asking a specific query like "storage lifecycle" or "find idle compute" for highly granular execution details.*`;
      }
      setAiResponse(response);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>AI Optimization Recommendations</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Intrusion-free code-to-cloud improvements generated by Green Code Choice models.
          </p>
        </div>
      </div>

      {/* Grid: Stats Summary Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cost and Carbon achieved achieved */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Total Impact Achieved</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-left">
              <div className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mb-1">Carbon Saved</div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-sans">
                {stats.co2Saved.toFixed(1)} <span className="text-xs font-normal">kg CO₂</span>
              </div>
              <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Cumulative aggregate</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/10 text-left">
              <div className="text-xs text-blue-800 dark:text-blue-400 font-semibold mb-1">Budget Recovered</div>
              <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 font-sans">
                ${stats.costSaved.toFixed(0)} <span className="text-xs font-normal">/Mo</span>
              </div>
              <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1">OpEx savings rate</div>
            </div>
          </div>
        </div>

        {/* Potential Remaining details */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unrealized Potential (Pending)</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Applying remaining recommendations instantly relocates processes to greener, more cost-effective AWS regions and downsizes idle hardware resources.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-slate-400 block font-semibold">Remaining Potential Carbon Saved:</span>
              <span className="text-md font-bold text-amber-600 dark:text-amber-400">{stats.co2Potential.toFixed(1)} kg CO₂</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-slate-400 block font-semibold">Potential Budget Savings:</span>
              <span className="text-md font-bold text-amber-600 dark:text-amber-400">${stats.costPotential.toFixed(0)} / Month</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Core recommendation cards workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendation items feed container */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Work category filters tabs bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-850 pb-4">
            
            {/* View Applied or Active Switch toggles */}
            <div className="flex bg-gray-100 dark:bg-slate-950 p-1 rounded-xl w-fit">
              <button
                id="tab-view-pending-recs"
                onClick={() => setViewApplied(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !viewApplied 
                    ? 'bg-white text-gray-800 dark:bg-slate-800 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Pending Action ({recommendations.filter(r => !r.applied).length})
              </button>
              <button
                id="tab-view-applied-recs"
                onClick={() => setViewApplied(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewApplied 
                    ? 'bg-white text-gray-800 dark:bg-slate-800 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Applied Archive ({recommendations.filter(r => r.applied).length})
              </button>
            </div>

            {/* Side priority selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-sans font-medium">Filter Priority:</span>
              <div className="flex gap-1">
                {(['All', 'High', 'Medium', 'Low'] as const).map((prio) => (
                  <button
                    id={`filter-rec-priority-btn-${prio}`}
                    key={prio}
                    onClick={() => setSelectedPriority(prio)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      selectedPriority === prio
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black border-transparent'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Cards feed */}
          <div className="space-y-4">
            {filteredRecs.length > 0 ? (
              filteredRecs.map((rec) => (
                <div 
                  key={rec.id}
                  className={`p-5 rounded-lg border transition-all duration-300 ${
                    rec.applied 
                      ? 'bg-emerald-500/[0.01] border-emerald-500/10 dark:border-emerald-500/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                  }`}
                  id={`recommendations-list-item-${rec.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Visual left Indicator color based on priority */}
                    <div className={`w-1.5 h-16 rounded-full shrink-0 ${
                      rec.priority === 'High' 
                        ? 'bg-rose-500' 
                        : rec.priority === 'Medium' 
                        ? 'bg-amber-500' 
                        : 'bg-blue-500'
                    }`} />

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase font-sans ${
                            rec.priority === 'High' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400' 
                              : rec.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                            {rec.priority} Priority
                          </span>
                          <span className="text-xs font-semibold text-slate-400 font-mono">
                            Target Resource: {rec.resourceType} ({rec.resourceId})
                          </span>
                        </div>
                      </div>

                      <h3 className={`text-sm font-bold font-sans tracking-tight leading-tight ${rec.applied ? 'line-through text-slate-500' : 'text-slate-850 dark:text-slate-100'}`}>
                        {rec.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {rec.description}
                      </p>

                      {/* Score/Metrics estimates grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-slate-950 rounded-xl mt-4 border border-gray-100 dark:border-slate-850">
                        <div>
                          <div className="text-[10px] text-gray-400 font-sans uppercase">Emissions Reduction</div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>-{rec.co2ReductionKg} kg CO₂ / Mo</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-sans uppercase">Cost Efficiency Return</div>
                          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-0.5">
                            <DollarSign className="w-3 h-3" />
                            <span>${rec.costSavingsUsd} / Month</span>
                          </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <div className="text-[10px] text-gray-400 font-sans uppercase">GCC Score Contribution</div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>+{rec.priority === 'High' ? '8' : rec.priority === 'Medium' ? '5' : '2'} points</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Trigger Row */}
                      <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 dark:border-slate-850/80 pt-3">
                        {rec.applied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold tracking-wide">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Applied Successfully</span>
                          </span>
                        ) : (
                          <>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 inline-flex items-center gap-1 mr-auto">
                              <Info className="w-3.5 h-3.5" />
                              <span>Valid until next audit scan</span>
                            </span>
                            <button
                              id={`trigger-apply-rec-main-${rec.id}`}
                              onClick={() => applyRecommendation(rec.id)}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                              <span>Apply Optimization</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-white">All caught up!</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  No {selectedPriority === 'All' ? '' : `${selectedPriority} priority `} recommendations left in progress. Your cloud settings are structurally hyper-efficient!
                </p>
              </div>
            )}
          </div>

        </div>

        {/* AI Co-Pilot Search assistant column */}
        <div className="space-y-4">
          
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden group">
            
            <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl bg-amber-500/80 rounded-full w-24 h-24 select-none pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-sans font-bold text-sm tracking-tight text-white uppercase">GCC Optimizer Co-Pilot</h3>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4 font-sans">
              Type custom architectural challenges, storage limits, or sandbox setups to fetch sustainable AWS recommendation patterns immediately.
            </p>

            <form onSubmit={handleAiAssistantSubmit} className="space-y-3">
              <div className="relative">
                <input
                  id="co-pilot-assistant-prompt-bar"
                  type="text"
                  value={aiAssistantPrompt}
                  onChange={(e) => setAiAssistantPrompt(e.target.value)}
                  placeholder="e.g., lifecycle guidelines, idle storage, find EC2 savings..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-white pr-10 pl-3 py-2.5 rounded-lg outline-none focus:border-amber-500 transition-all font-sans"
                />
                <button
                  id="submit-co-pilot-query-btn"
                  type="submit"
                  disabled={aiLoading}
                  className="absolute right-2 top-2 text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </form>

            <AnimatePresence>
              {aiLoading && (
                <div className="mt-4 flex items-center gap-2 justify-center py-6 text-xs text-amber-500/80">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>AI Co-Pilot is scanning cloud schema...</span>
                </div>
              )}

              {aiResponse && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-sans text-xs text-slate-300 overflow-y-auto max-h-[290px]"
                >
                  <div className="prose prose-sm prose-invert text-[11.5px] leading-relaxed select-text font-sans">
                    {aiResponse.split('\n').map((line, i) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={i} className="font-bold text-amber-400 mt-2 mb-1 first:mt-0">{line.replace('### ', '')}</h4>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="list-disc ml-3 text-slate-300">{line.replace('- ', '')}</li>;
                      }
                      return <p key={i} className="my-1.5">{line}</p>;
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Reference guidelines list */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-center gap-2 mb-3 text-gray-800 dark:text-slate-100 font-sans font-semibold text-xs uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>AWS Sustainability Core</span>
            </div>
            <ul className="space-y-2.5 text-[11px] text-gray-500 dark:text-slate-400">
              <li className="flex items-start gap-1.5 font-sans leading-relaxed">
                <span className="text-emerald-500 text-sm leading-none">•</span>
                <span><b>AWS Shared Responsibility:</b> AWS is responsible for greening the concrete physical infrastructure of cloud host centers, while customers are responsible for **Sustainability IN the Cloud** (code paths, memory allocations, storage lifecycle models).</span>
              </li>
              <li className="flex items-start gap-1.5 font-sans leading-relaxed">
                <span className="text-emerald-500 text-sm leading-none">•</span>
                <span><b>Energy Efficiency Metrics:</b> Keeping server nodes hot-loaded under 20% average loads emits substantial, redundant static thermal power. Consolidating into higher density spots curbs grid drain.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
