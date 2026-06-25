import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';

// Imports sub-modules & dataset baselines
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ResourceAnalysis from './components/ResourceAnalysis';
import AIRecommendations from './components/AIRecommendations';
import FootprintReport from './components/FootprintReport';
import Settings from './components/Settings';

import { 
  INITIAL_RESOURCES, 
  INITIAL_RECOMMENDATIONS, 
  REGIONAL_DATA, 
  INITIAL_HISTORY, 
  INITIAL_SETTINGS 
} from './data';
import { AppSettings, CloudResource, AIRecommendation, AuditHistoryEntry, TelemetryData, LiveEvent } from './types';

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Core managed data arrays
  const [resources, setResources] = useState<CloudResource[]>(INITIAL_RESOURCES);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [history, setHistory] = useState<AuditHistoryEntry[]>(INITIAL_HISTORY);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Real-time telemetry state
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean>(true);
  const [telemetryDataHistory, setTelemetryDataHistory] = useState<TelemetryData[]>([]);
  const [liveEventsList, setLiveEventsList] = useState<LiveEvent[]>([]);

  // AWS Sustainability Interactive States
  const [workloadsShifted, setWorkloadsShifted] = useState<boolean>(false);
  const [archMigrated, setArchMigrated] = useState<boolean>(false);

  // Visual feedback & Simulator status states
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to dark mode for AWS-style Sustainability Control Room
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveAws, setLiveAws] = useState<boolean>(false);

  // Core API: Fetch status and sync resources from active Node server
  const fetchAwsStatusAndMetrics = async (showLoading = false) => {
    if (showLoading) setGlobalLoading(true);
    try {
      // 1. Fetch AWS link status
      const statusRes = await fetch('/api/aws/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSettings(prev => ({
          ...prev,
          awsConnected: statusData.awsConnected,
          awsAccountId: statusData.awsConnected ? statusData.awsAccountId : ''
        }));
      }

      // 2. Fetch resource metrics
      const metricsRes = await fetch('/api/aws/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setResources(metricsData.resources);
        setLiveAws(metricsData.liveAws);
        if (metricsData.warning && showLoading) {
          console.warn(metricsData.warning);
        }
      }
    } catch (err: any) {
      console.error("Failed real-time AWS fetch session:", err);
      // Fallback gracefully without crash
    } finally {
      if (showLoading) setGlobalLoading(false);
    }
  };

  // Run on mount with dynamic background refreshes (every 10 seconds)
  useEffect(() => {
    fetchAwsStatusAndMetrics(true);

    const interval = setInterval(() => {
      fetchAwsStatusAndMetrics(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Sync state between dark mode settings and body tags securely
  useEffect(() => {
    // If running in sandbox environment, wrapper container handles class.
    // Setting document class triggers global body variables perfectly.
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Flash toast notifications automatically
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handler: Manual force refresh cloud auditor
  const handleAuditorRefresh = async () => {
    setIsRefreshing(true);
    setGlobalError(null);
    try {
      await fetchAwsStatusAndMetrics(false);
      setToastMessage('Live AWS Inventory Scan Completed! Synced fresh parameters dynamically.');
    } catch (e) {
      setGlobalError('Failed to capture live metrics from CloudWatch server.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler: Update parameters dynamically from the Settings Panel
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Trigger quick background metrics update to match state connection changes instantly
    fetchAwsStatusAndMetrics(false);
  };

  // Handler: Apply AI recommendation action
  const handleApplyRecommendation = (recId: string) => {
    const recIndex = recommendations.findIndex(r => r.id === recId);
    if (recIndex === -1) return;

    const rec = recommendations[recIndex];
    if (rec.applied) return;

    // Apply recommendation state change
    const updatedRecs = [...recommendations];
    updatedRecs[recIndex] = { ...rec, applied: true };
    setRecommendations(updatedRecs);

    // Dynamic cascade calculations to update related active resources
    if (rec.resourceId) {
      const updatedResources = resources.map(res => {
        if (res.id === rec.resourceId) {
          // Decrement emissions & monthly costs proportionally matching the AI proposal
          const newCarbon = Math.max(0, res.carbonEmissionKg - rec.co2ReductionKg);
          const newCost = Math.max(0, res.monthlyCost - rec.costSavingsUsd);
          return {
            ...res,
            status: 'optimized' as const,
            carbonEmissionKg: Math.round(newCarbon * 10) / 10,
            monthlyCost: Math.round(newCost * 10) / 10,
            suggestion: undefined // Clear prompt since it was optimized
          };
        }
        return res;
      });
      setResources(updatedResources);
    }

    setToastMessage(`Executed Optimization: "${rec.title}" is now active in your AWS sandbox.`);
  };

  // SSE Telemetry listener effect
  useEffect(() => {
    if (!telemetryEnabled) {
      return;
    }

    const eventSource = new EventSource('/api/aws/telemetry');

    eventSource.onmessage = (event) => {
      try {
        const data: TelemetryData = JSON.parse(event.data);
        
        setTelemetryDataHistory(prev => {
          const next = [...prev, data];
          if (next.length > 20) {
            next.shift();
          }
          return next;
        });

        if (data.liveEvent) {
          setLiveEventsList(prev => {
            const next = [data.liveEvent!, ...prev];
            if (next.length > 50) {
              next.pop();
            }
            return next;
          });

          // If autoOptimize is enabled and a warning comes in, apply optimization
          if (settings.autoOptimize && data.liveEvent.type === 'warning') {
            setRecommendations(prevRecs => {
              const pending = prevRecs.filter(r => !r.applied);
              if (pending.length > 0) {
                // Select first pending recommendation to auto-apply
                const recToApply = pending[0];
                setTimeout(() => {
                  handleApplyRecommendation(recToApply.id);
                }, 100);
              }
              return prevRecs;
            });
          }
        }

        // Apply slight real-time fluctuations to non-optimized resources
        setResources(prev => prev.map(res => {
          if (res.status === 'optimized') return res;
          const fluctuation = 0.985 + Math.random() * 0.03; // +/- 1.5%
          return {
            ...res,
            energyUsageKwh: Math.round(res.energyUsageKwh * fluctuation * 10) / 10,
            carbonEmissionKg: Math.round(res.carbonEmissionKg * fluctuation * 10) / 10,
            monthlyCost: Math.round(res.monthlyCost * fluctuation * 100) / 100
          };
        }));

      } catch (err) {
        console.error("SSE stream JSON parsing failure:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE telemetry stream connection error, retrying...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [telemetryEnabled, settings.autoOptimize]);

  // Handler: Quick optimization from individual resource tables
  const handleApplyQuickOptimisation = (resourceId: string, reductionKg: number, savingsUsd: number) => {
    const updatedResources = resources.map(res => {
      if (res.id === resourceId) {
        return {
          ...res,
          status: 'optimized' as const,
          carbonEmissionKg: Math.max(0, res.carbonEmissionKg - reductionKg),
          monthlyCost: Math.max(0, res.monthlyCost - savingsUsd),
          suggestion: undefined
        };
      }
      return res;
    });
    setResources(updatedResources);

    // Find custom matching recommendations and mark applied
    const updatedRecs = recommendations.map(rec => {
      if (rec.resourceId === resourceId) {
        return { ...rec, applied: true };
      }
      return rec;
    });
    setRecommendations(updatedRecs);

    setToastMessage('Resource optimized successfully. Calculated footprint parameters decremented.');
  };

  // Handler: Toggle workload scheduling alignment
  const handleToggleWorkloadShifting = () => {
    const nextState = !workloadsShifted;
    setWorkloadsShifted(nextState);
    if (nextState) {
      setResources(prev => prev.map(res => {
        if (res.id === 'i-0mm55nn66oo77pp88') {
          return {
            ...res,
            carbonEmissionKg: Math.round(res.carbonEmissionKg * 0.3 * 10) / 10,
            energyUsageKwh: Math.round(res.energyUsageKwh * 0.7 * 10) / 10,
            status: 'optimized' as const,
            suggestion: undefined
          };
        }
        return res;
      }));
      setToastMessage('Workload Shifting Active: Shifted stateless batch workloads to green energy windows.');
    } else {
      setResources(prev => prev.map(res => {
        if (res.id === 'i-0mm55nn66oo77pp88') {
          const initRes = INITIAL_RESOURCES.find(r => r.id === 'i-0mm55nn66oo77pp88')!;
          return { ...initRes };
        }
        return res;
      }));
      setToastMessage('Workload Shifting Inactive: Workloads restored to default schedule.');
    }
  };

  // Handler: Toggle architecture migration
  const handleToggleArchMigration = () => {
    const nextState = !archMigrated;
    setArchMigrated(nextState);
    if (nextState) {
      setResources(prev => prev.map(res => {
        if (res.region === 'us-east-1') {
          return {
            ...res,
            region: 'us-west-2',
            carbonEmissionKg: Math.round(res.carbonEmissionKg * 0.3 * 10) / 10,
            status: 'optimized' as const,
            suggestion: undefined
          };
        }
        return res;
      }));
      setToastMessage('Architecture Relocated: Non-critical services migrated to green Oregon (us-west-2) grid.');
    } else {
      setResources(prev => prev.map(res => {
        const initRes = INITIAL_RESOURCES.find(r => r.id === res.id);
        if (initRes && initRes.region === 'us-east-1') {
          return { ...initRes };
        }
        return res;
      }));
      setToastMessage('Architecture Restored: Services relocated back to N. Virginia (us-east-1).');
    }
  };

  // Diagnostics: simulated global skeletons
  const handleTriggerSimulatedLoading = () => {
    setGlobalLoading(true);
    setTimeout(() => {
      setGlobalLoading(false);
      setToastMessage('Completed scan metrics fetch. Dashboard charts matched.');
    }, 2000);
  };

  // Compute live cumulative sustainability score
  const totalRecsCount = recommendations.length;
  const appliedRecsCount = recommendations.filter(r => r.applied).length;
  const baseScore = 65;
  const totalDifference = 35;
  const scoreProgressRatio = totalRecsCount > 0 ? (appliedRecsCount / totalRecsCount) : 0;
  const finalScoreVal = Math.min(100, baseScore + Math.round(scoreProgressRatio * totalDifference));

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-800 dark:text-slate-100 flex transition-colors duration-200`}>
      
      {/* Sidebar Navigation (Collapsible) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        
        {/* Top Navbar */}
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          setMobileOpen={setMobileOpen}
          settings={settings}
          sustainabilityScore={finalScoreVal}
          onRefresh={handleAuditorRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Canvas workspace container with smooth transitions */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto relative cursor-default">
          
          {/* Toast Notification Container */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xl border border-slate-800 dark:border-gray-200 flex items-center gap-2.5 max-w-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold leading-relaxed text-left">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated Error Alert Area */}
          {globalError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold font-sans uppercase">IAM Policy Security Exception</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400/90 mt-1 leading-relaxed">{globalError}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    id="resolve-exception-shortcut-btn"
                    onClick={() => {
                      setGlobalError(null);
                      setToastMessage('Permissions re-validated. Connected normally.');
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors"
                  >
                    Quick Resolve Link
                  </button>
                  <button
                    id="settings-tab-resolve-btn"
                    onClick={() => {
                      setGlobalError(null);
                      setActiveTab('settings');
                    }}
                    className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors"
                  >
                    Go To Credentials settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pages Workspace view distribution switcher */}
          {globalLoading ? (
            /* Pulsing layout skeletons matching exact KPI grids and panels */
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-28 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[260px] bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-[260px] bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    resources={resources}
                    recommendations={recommendations}
                    history={history}
                    applyRecommendation={handleApplyRecommendation}
                    setActiveTab={setActiveTab}
                    telemetryEnabled={telemetryEnabled}
                    setTelemetryEnabled={setTelemetryEnabled}
                    telemetryDataHistory={telemetryDataHistory}
                    liveEventsList={liveEventsList}
                    workloadsShifted={workloadsShifted}
                    toggleWorkloadShifting={handleToggleWorkloadShifting}
                    archMigrated={archMigrated}
                    toggleArchMigration={handleToggleArchMigration}
                  />
                )}
                
                {activeTab === 'resources' && (
                  <ResourceAnalysis 
                    resources={resources}
                    applyQuickOptimisation={handleApplyQuickOptimisation}
                  />
                )}

                {activeTab === 'recommendations' && (
                  <AIRecommendations 
                    recommendations={recommendations}
                    applyRecommendation={handleApplyRecommendation}
                  />
                )}

                {activeTab === 'reports' && (
                  <FootprintReport 
                    resources={resources}
                    history={history}
                    regions={REGIONAL_DATA}
                    appliedRecsCount={appliedRecsCount}
                    totalRecsCount={totalRecsCount}
                  />
                )}

                {activeTab === 'settings' && (
                  <Settings 
                    settings={settings}
                    updateSettings={handleUpdateSettings}
                    regions={REGIONAL_DATA}
                    triggerGlobalError={setGlobalError}
                    triggerGlobalLoading={handleTriggerSimulatedLoading}
                    onRefreshMetrics={() => fetchAwsStatusAndMetrics(false)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

        </main>

        {/* Simple visual attribution credit footer */}
        <footer className="py-6 border-t border-gray-150 dark:border-slate-900/80 bg-white/40 dark:bg-slate-950/20 text-center text-[11px] text-gray-400 dark:text-slate-500 font-sans tracking-wide">
          <span>&copy; {new Date().getFullYear()} Green Code Choice Platform. All AWS sustainability coefficients parsed locally.</span>
        </footer>

      </div>

    </div>
  );
}
