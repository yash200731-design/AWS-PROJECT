import { Sun, Moon, Menu, Cloud, CloudOff, RefreshCw, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  settings: AppSettings;
  sustainabilityScore: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Navbar({
  darkMode,
  setDarkMode,
  setMobileOpen,
  settings,
  sustainabilityScore,
  onRefresh,
  isRefreshing
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 transition-colors duration-200">
      
      {/* Mobile Menu & Brand Icon on Right */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-open-sidebar-btn"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md md:hidden transition-all duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* AWS Account ID Badge */}
        {settings.awsConnected ? (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800 rounded-md">
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
              AWS: {settings.awsAccountId}
            </span>
            <span className="inline sm:hidden text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
              LIVE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-800 rounded-md">
            <CloudOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              AWS Offline
            </span>
          </div>
        )}

        {/* Refresh audit state button */}
        <button
          id="trigger-refresh-audit-btn"
          onClick={onRefresh}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-150"
          title="Force Sustainability Scan"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Right side interactions (Score, Theme Toggle, User Email metadata) */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Dynamic Sustainability Grade badge */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 px-3 py-1 bg-white dark:bg-slate-950 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Score:</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{sustainabilityScore}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">/100</span>
          </div>
          {/* Progress pill indicator */}
          <div className="hidden xs:block w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 select-none transition-all duration-500" 
              style={{ width: `${sustainabilityScore}%` }}
            />
          </div>
        </div>

        {/* Dark Mode switcher */}
        <button
          id="dark-mode-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 transition-all"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* User Identity Frame */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">Enterprise</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">Yash</span>
          </div>
        </div>
      </div>
    </header>
  );
}
