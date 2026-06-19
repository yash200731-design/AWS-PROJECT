import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  LayoutDashboard, 
  Database, 
  Sparkles, 
  TrendingDown, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CloudLightning
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
    { id: 'resources', label: 'Resource Analysis', icon: Database, color: 'text-blue-500' },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, color: 'text-amber-500' },
    { id: 'reports', label: 'Carbon Report', icon: TrendingDown, color: 'text-rose-500' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-indigo-500' },
  ];

  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '80px' }
  };

  const navContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
      {/* Brand logo */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col text-left"
            >
              <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white uppercase">Green Code</span>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-widest leading-none">CHOICE</span>
            </motion.div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button 
            id="mobile-close-sidebar-btn"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto w-full text-left">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left font-sans text-sm font-medium transition-all group relative duration-200 ${
                isActive 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500 shadow-sm' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded transition-colors ${isActive ? 'bg-emerald-100/40 dark:bg-emerald-500/20' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50'}`}>
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {/* Tooltip for collapsed desktop mode */}
              {sidebarCollapsed && !isMobile && (
                <div className="absolute left-20 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-950 dark:bg-slate-900 text-white text-[11px] font-medium tracking-wide font-sans py-1.5 px-3 rounded-lg shadow-xl z-50 whitespace-nowrap border border-slate-800">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud efficiency micro badge / footer */}
      {(!sidebarCollapsed || isMobile) ? (
        <div className="p-4 mx-3 mb-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 mb-2 justify-start">
            <CloudLightning className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">System Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans text-left">
            Optimizing active AWS resources. Saving overhead thermal outputs in real time.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
            <span>Core v3.2</span>
            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Green Grid Ready</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-emerald-500">
            <CloudLightning className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Collapse Trigger for Desktop */}
      {!isMobile && (
        <div className="hidden md:flex p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex justify-center items-center py-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-sans tracking-wide">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Panel</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile navigation side drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop slide-in/out */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Slide menu content container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[280px] max-w-sm h-full flex flex-col z-50 shadow-2xl"
            >
              {navContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop permanent side rail */}
      <motion.div
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="hidden md:block h-full shrink-0 z-40 overflow-hidden"
      >
        {navContent(false)}
      </motion.div>
    </>
  );
}
