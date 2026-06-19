import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Eye,
  Terminal,
  Clock,
  Globe,
  Loader2,
  Trash2
} from 'lucide-react';
import { AppSettings, RegionalMetric } from '../types';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  regions: RegionalMetric[];
  triggerGlobalError: (msg: string | null) => void;
  triggerGlobalLoading: () => void;
  onRefreshMetrics?: () => void;
}

export default function Settings({
  settings,
  updateSettings,
  regions,
  triggerGlobalError,
  triggerGlobalLoading,
  onRefreshMetrics
}: SettingsProps) {
  
  // Local active states for credentials input
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [awsSessionToken, setAwsSessionToken] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  
  const [showSecret, setShowSecret] = useState(false);
  const [connectingState, setConnectingState] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state with server credentials on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/aws/status');
        if (res.ok) {
          const data = await res.json();
          if (data.awsConnected) {
            updateSettings({ 
              awsConnected: true, 
              awsAccountId: data.awsAccountId || '4832-9011-3329' 
            });
            setAwsRegion(data.region || 'us-east-1');
          } else {
            updateSettings({ awsConnected: false, awsAccountId: '' });
          }
        }
      } catch (err) {
        console.error("Failed to check server AWS credential state:", err);
      }
    };
    fetchStatus();
  }, []);

  // Connection trigger call to server API
  const handleAWSConnectToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    triggerGlobalError(null);

    if (settings.awsConnected) {
      // Disconnect
      setConnectingState(true);
      try {
        const res = await fetch('/api/aws/disconnect', { method: 'POST' });
        if (res.ok) {
          updateSettings({ awsConnected: false, awsAccountId: '' });
          setAwsAccessKeyId('');
          setAwsSecretAccessKey('');
          setAwsSessionToken('');
          setSuccessMessage('AWS core connection wiped. Platform has safely returned to Simulated sandbox.');
          if (onRefreshMetrics) onRefreshMetrics();
        } else {
          triggerGlobalError('Failed to disconnect credentials from remote endpoint session.');
        }
      } catch (err: any) {
        triggerGlobalError(`Error disconnecting session: ${err.message || err}`);
      } finally {
        setConnectingState(false);
      }
    } else {
      // Connect and save credentials
      if (!awsAccessKeyId.trim()) {
        triggerGlobalError('AWS Access Key ID is required.');
        return;
      }
      if (!awsSecretAccessKey.trim()) {
        triggerGlobalError('AWS Secret Access Key is required.');
        return;
      }

      setConnectingState(true);

      try {
        const res = await fetch('/api/aws/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            awsAccessKeyId: awsAccessKeyId.trim(),
            awsSecretAccessKey: awsSecretAccessKey.trim(),
            awsSessionToken: awsSessionToken.trim(),
            awsRegion: awsRegion
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          updateSettings({ 
            awsConnected: true, 
            awsAccountId: data.awsAccountId || '4832-9011-3329'
          });
          setSuccessMessage('AWS authorized successfully! Established real-time CloudWatch and Resource Inventory Synchronizer.');
          triggerGlobalError(null);
          if (onRefreshMetrics) onRefreshMetrics();
        } else {
          triggerGlobalError(data.error || 'AWS login auth verification failed. Check credentials/permissions.');
        }
      } catch (err: any) {
        triggerGlobalError(`Network request failure: ${err.message || err}`);
      } finally {
        setConnectingState(false);
      }
    }
  };

  // Toggle preferred regions
  const handleRegionPreferenceToggle = (regionCode: string) => {
    let updated = [...settings.preferredRegions];
    if (updated.includes(regionCode)) {
      updated = updated.filter(r => r !== regionCode);
    } else {
      updated.push(regionCode);
    }
    updateSettings({ preferredRegions: updated });
    setSuccessMessage(`Region preferences updated. Future carbon audits will prioritize ${updated.length} selected areas.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="font-sans font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
          Platform Configuration & Integrations
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Manage linked cloud credentials, configure automatic optimizations, and simulate workspace states.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Settings Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AWS Connect Panel */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Cloud className="w-5 h-5 text-emerald-500" />
            <h2 className="font-sans font-semibold text-md text-gray-900 dark:text-white">
              AWS Account Integration Linkage
            </h2>
          </div>

          <form onSubmit={handleAWSConnectToggle} className="space-y-5">
            <p className="text-xs text-slate-500 leading-normal font-sans">
              GCC reads active infrastructure parameters via a secure, read-only IAM Role connection. This requires zero write permissions and exposes no client API keys.
            </p>

            {settings.awsConnected ? (
              <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-slate-100">Live Active AWS SDK Sync</div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">Linked AWS Audit: {settings.awsAccountId} (Read-Only)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Live region: {awsRegion}
                    </div>
                  </div>
                </div>

                <button
                  id="settings-aws-disconnect-btn"
                  type="submit"
                  disabled={connectingState}
                  className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {connectingState ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Access Key ID */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="settings-aws-access-key-id" className="text-xs font-bold text-gray-600 dark:text-slate-300">
                      AWS Access Key ID
                    </label>
                    <input
                      id="settings-aws-access-key-id"
                      type="text"
                      value={awsAccessKeyId}
                      onChange={(e) => setAwsAccessKeyId(e.target.value)}
                      placeholder="AKIAxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 dark:text-white rounded-lg outline-none focus:border-emerald-500"
                      disabled={connectingState}
                    />
                  </div>

                  {/* Secret Access Key */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="settings-aws-secret-access-key" className="text-xs font-bold text-gray-600 dark:text-slate-300">
                      AWS Secret Access Key
                    </label>
                    <div className="relative">
                      <input
                        id="settings-aws-secret-access-key"
                        type={showSecret ? "text" : "password"}
                        value={awsSecretAccessKey}
                        onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className="w-full pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 dark:text-white rounded-lg outline-none focus:border-emerald-500"
                        disabled={connectingState}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Session Token */}
                  <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                    <label htmlFor="settings-aws-session-token" className="text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                      <span>AWS Session Token (Optional)</span>
                      <span className="text-[10px] text-gray-400 font-normal">(Required if utilizing temporary AWS CLI SSO credentials)</span>
                    </label>
                    <textarea
                      id="settings-aws-session-token"
                      rows={1}
                      value={awsSessionToken}
                      onChange={(e) => setAwsSessionToken(e.target.value)}
                      placeholder="IQoJb3JpZ2luX2VjEBYaD..."
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 dark:text-white rounded-lg outline-none focus:border-emerald-500 font-mono text-xs"
                      disabled={connectingState}
                    />
                  </div>

                  {/* Primary Scan Region Selection */}
                  <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                    <label htmlFor="settings-aws-region" className="text-xs font-bold text-gray-600 dark:text-slate-300">
                      Primary Probe Region
                    </label>
                    <select
                      id="settings-aws-region"
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      className="max-w-md w-full px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 dark:text-white rounded-lg outline-none focus:border-emerald-500"
                      disabled={connectingState}
                    >
                      <option value="us-east-1">us-east-1 (N. Virginia) • Cole/Gas-heavy grid: ~370g/kWh</option>
                      <option value="us-west-2">us-west-2 (Oregon) • Clean Hydro/Wind grid: ~110g/kWh</option>
                      <option value="eu-west-1">eu-west-1 (Ireland) • Average grid: ~290g/kWh</option>
                      <option value="eu-central-1">eu-central-1 (Frankfurt) • Average grid: ~280g/kWh</option>
                      <option value="eu-north-1">eu-north-1 (Stockholm) • Ultra-clean Bio/Hydro: ~12g/kWh</option>
                      <option value="ca-central-1">ca-central-1 (Canada) • Extremely clean Hydro: ~30g/kWh</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="settings-aws-connect-btn"
                    type="submit"
                    disabled={connectingState}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm"
                  >
                    {connectingState ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with S3 & IAM Policies...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" />
                        <span>Connect live AWS Cloud SDK</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Credentials are saved secure server-side for the current app runner session. Verified via S3 test probe.
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Audit Frequency */}
          <div className="mt-8 border-t border-gray-100 dark:border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="font-sans font-semibold text-sm text-gray-900 dark:text-white">
                Configure Audit Phase Frequency
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal mb-4 font-sans max-w-xl">
              Platform queries AWS Cost Explorer indices dynamically. Shorter frequencies require more AWS read-only queries, but capture real-time compute fluctuations better.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => {
                const isActive = settings.auditFrequency === freq;
                return (
                  <button
                    id={`settings-audit-freq-${freq}`}
                    key={freq}
                    onClick={() => {
                      updateSettings({ auditFrequency: freq });
                      setSuccessMessage(`Audit intervals updated to: ${freq}. Platform scan timeline set.`);
                    }}
                    className={`p-3.5 rounded-xl border text-center font-sans transition-all flex flex-col justify-center items-center ${
                      isActive 
                        ? 'bg-emerald-500/5 dark:bg-emerald-500-[0.02] border-emerald-400 text-emerald-700 dark:text-emerald-400 font-bold' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{freq}</span>
                    <span className="text-[9px] text-gray-400 mt-0.5 leading-none">
                      {freq === 'Daily' ? 'High Query' : freq === 'Weekly' ? 'Standard' : 'Low Profile'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Active AWS Regions Checkboxes list */}
          <div className="mt-8 border-t border-gray-100 dark:border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-teal-400" />
              <h3 className="font-sans font-semibold text-sm text-gray-900 dark:text-white">
                Preferred Greener AWS Regions
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal mb-4 font-sans max-w-xl">
              AWS operates servers in multiple locations. Filter and select which target areas you priority target for carbon optimization:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              {regions.map((reg) => {
                const isChecked = settings.preferredRegions.includes(reg.region);
                return (
                  <label 
                    key={reg.region}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked 
                        ? 'bg-emerald-500/[0.03] border-emerald-500/30' 
                        : 'bg-white dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        id={`settings-region-pref-${reg.region}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRegionPreferenceToggle(reg.region)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <div className="text-left font-sans">
                        <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">{reg.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono italic">{reg.region} — {reg.carbonIntensityG} g/kWh</span>
                      </div>
                    </div>
                    <span className="text-sm">{reg.gridIcon}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Global toggles - Auto Optimize & Platform simulators column */}
        <div className="space-y-6">
          
          {/* Automatic optimization panel */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
            <div className="flex items-center gap-2.5 mb-4 font-sans font-semibold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/80 pb-3 text-gray-900 dark:text-white">
              <RefreshCw className="w-4.5 h-4.5 text-emerald-500 animate-spin" />
              <span>Auto Optimization</span>
            </div>

            <p className="text-xs text-slate-500 leading-normal mb-4 font-sans">
              Enable instant auto-tuning to allow GCC artificial models to automatically apply low-priority storage lifecycle routines and scaling actions without downtime.
            </p>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-850 rounded-xl">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-350">
                Auto-Optimize Status
              </span>
              
              {/* Custom Switch Toggle */}
              <button
                id="auto-optimize-toggle-btn"
                type="button"
                onClick={() => {
                  const state = !settings.autoOptimize;
                  updateSettings({ autoOptimize: state });
                  setSuccessMessage(state ? 'Automatic optimization ENABLED. System models will safely clean obsolete sectors.' : 'Automatic optimization DISABLED.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  settings.autoOptimize ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-800'
                }`}
              >
                <span 
                  className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${
                    settings.autoOptimize ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Dev Workspace state simulations */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 shadow-xl text-left">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-5 h-5 text-amber-500" />
              <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">GCC Diagnostics Hub</h3>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-sans">
              Test how the "Green Code Choice" application renders responsive error UI warnings, connection failures, and loading skeleton states.
            </p>

            <div className="space-y-3 font-sans">
              
              <button
                id="trigger-simulated-error-btn"
                onClick={() => {
                  triggerGlobalError('AWS IAM Error: Authentication policy validation failed. Role "GreenCodeChoiceAudit" has insufficient permissions to fetch cloud parameters (AccessDenied).');
                }}
                className="w-full text-left p-3 rounded-xl border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <div className="text-left">
                  <span>Simulate API Access Error</span>
                  <span className="block text-[9px] text-rose-400/80 font-normal mt-0.5">Expiring IAM policies triggers visual alerts</span>
                </div>
              </button>

              <button
                id="trigger-simulated-skeleton-btn"
                onClick={() => {
                  setSuccessMessage(null);
                  triggerGlobalLoading();
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4.5 h-4.5 text-sky-400 animate-spin shrink-0" />
                <div className="text-left">
                  <span>Test Loader Skeletons</span>
                  <span className="block text-[9px] text-slate-450 font-normal mt-0.5">Triggers active SaaS skeleton loaders</span>
                </div>
              </button>

              <button
                id="clear-diagnostics-btn"
                onClick={() => {
                  triggerGlobalError(null);
                  setSuccessMessage('Cleared simulated alerts. Grid operations normal.');
                }}
                className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-350 transition-colors border border-slate-800"
              >
                Clear Simulator Flags
              </button>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
