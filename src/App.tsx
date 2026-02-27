import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Terminal, 
  Settings, 
  Activity, 
  Database, 
  BarChart3, 
  ExternalLink, 
  ChevronRight,
  Search,
  MoreHorizontal,
  Cloud,
  Github,
  GitBranch,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { App, ConfigVar, Release, LogEntry, Addon, AddonCatalogItem, ActivityEvent } from './types';
import { LogsPage } from './components/LogsPage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Database, label: 'Add-ons', path: '/addons' },
    { icon: Terminal, label: 'CLI', path: '/cli' },
  ];

  return (
    <div className="w-64 bg-[#1a1a1a] text-gray-400 flex flex-col h-screen border-r border-white/10">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#79589F] rounded flex items-center justify-center text-white font-bold">B</div>
        <span className="text-white font-semibold text-lg">Bera Host</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              location.pathname === item.path 
                ? "bg-white/10 text-white" 
                : "hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18}/>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs">
        <p>© 2026 Bera Host PaaS</p>
      </div>
    </div>
  );
};

const TopBar = ({ title, actions }: { title: string, actions?: React.ReactNode }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#79589F] flex items-center justify-center text-white text-xs font-bold">KV</div>
          <span className="text-sm font-medium text-gray-700">kingvon.kenya@gmail.com</span>
        </div>
      </div>
    </header>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppRegion, setNewAppRegion] = useState('us');

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      setApps(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAppName, region: newAppRegion }),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setNewAppName('');
      fetchApps();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7F9]">
      <TopBar 
        title="Personal Apps" 
        actions={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#79589F] hover:bg-[#6a4d8c] text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18}/>
            New
          </button>
        } 
      />
      
      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input type="text" placeholder="Search apps..." className="w-full pl-10 pr-4 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"/>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading apps...</div>
            ) : apps.length === 0 ? (
              <div className="p-12 text-center">
                <Cloud className="mx-auto text-gray-300 mb-4" size={48}/>
                <h3 className="text-lg font-medium text-gray-900">No apps yet</h3>
                <p className="text-gray-500 mt-1">Create your first application to get started.</p>
              </div>
            ) : (
              apps.map((app) => (
                <Link key={app.id} to={`/apps/${app.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded flex items-center justify-center text-white font-bold",
                      app.status === 'running' ? "bg-emerald-500" : "bg-gray-400"
                    )}>
                      {app.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#79589F] transition-colors">{app.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="uppercase">{app.region}</span>
                        <span>•</span>
                        <span>Last updated {format(new Date(app.updated_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-gray-400" size={20}/>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">Create New App</h2>
            </div>
            <form onSubmit={handleCreateApp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input 
                  type="text" 
                  required 
                  value={newAppName} 
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="my-awesome-app"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select 
                  value={newAppRegion} 
                  onChange={(e) => setNewAppRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                >
                  <option value="us">United States (Virginia)</option>
                  <option value="eu">Europe (Ireland)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                  Cancel
                </button>
                <button type="submit" className="bg-[#79589F] hover:bg-[#6a4d8c] text-white px-6 py-2 rounded font-medium transition-colors">
                  Create App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AppDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchApp = async () => {
    const res = await fetch(`/api/apps/${id}`);
    if (res.ok) {
      const data = await res.json();
      setApp(data);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!app) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'resources', label: 'Resources', icon: Database },
    { id: 'deploy', label: 'Deploy', icon: Cloud },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7F9]">
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#79589F] rounded flex items-center justify-center text-white font-bold">
              {app.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{app.name}</h1>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  app.status === 'running' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                )}>
                  {app.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Personal • {app.region.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={`https://berahost.up.railway.app/${app.id}`} target="_blank" rel="noreferrer" className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              Open app <ExternalLink size={14}/>
            </a>
            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
              <MoreHorizontal size={18}/>
            </button>
          </div>
        </div>
        <nav className="px-8 flex gap-8">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-[#79589F] text-[#79589F]" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon size={16}/>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && <OverviewTab app={app} />}
          {activeTab === 'resources' && <ResourcesTab app={app} />}
          {activeTab === 'deploy' && <DeployTab app={app} onDeploy={fetchApp} />}
          {activeTab === 'metrics' && <MetricsTab app={app} />}
          {activeTab === 'activity' && <ActivityTab app={app} />}
          {activeTab === 'settings' && <SettingsTab app={app} onDelete={() => navigate('/')} />}
        </div>
      </main>
    </div>
  );
};

// --- Tab Components ---

const OverviewTab = ({ app }: { app: App }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Dyno formation</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded">
                <Cloud size={20}/>
              </div>
              <div>
                <p className="font-medium text-gray-900">web</p>
                <p className="text-xs text-gray-500">node index.js</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">1 x Free Dyno</p>
              <p className="text-xs text-gray-500">Standard-1X</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Activity</h3>
          <ActivityTab app={app} compact />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">App Info</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Framework</p>
              <p className="text-sm font-medium">Node.js</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Region</p>
              <p className="text-sm font-medium uppercase">{app.region}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stack</p>
              <p className="text-sm font-medium">Bera-22</p>
            </div>
          </div>
        </div>
        
        <Link to={`/apps/${app.id}/logs`} className="block w-full text-center py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
          <Terminal size={18}/>
          View Logs
        </Link>
      </div>
    </div>
  );
};

const ResourcesTab = ({ app }: { app: App }) => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [catalog, setCatalog] = useState<AddonCatalogItem[]>([]);
  const [showMarketplace, setShowMarketplace] = useState(false);

  const fetchData = async () => {
    const [addonsRes, catalogRes] = await Promise.all([
      fetch(`/api/apps/${app.id}/addons`),
      fetch('/api/addons/catalog')
    ]);
    setAddons(await addonsRes.json());
    setCatalog(await catalogRes.json());
  };

  useEffect(() => {
    fetchData();
  }, [app.id]);

  const handleProvision = async (addonId: string) => {
    await fetch(`/api/apps/${app.id}/addons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonId }),
    });
    setShowMarketplace(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add-ons</h3>
          <button onClick={() => setShowMarketplace(true)} className="text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium">
            Find more add-ons
          </button>
        </div>
        
        {addons.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="mx-auto text-gray-300 mb-4" size={48}/>
            <p className="text-gray-500">No add-ons provisioned for this app.</p>
            <button onClick={() => setShowMarketplace(true)} className="mt-4 px-6 py-2 bg-gray-50 border border-gray-200 rounded font-medium hover:bg-gray-100 transition-colors">
              Configure Add-ons
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {addons.map((addon) => (
              <div key={addon.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 text-purple-600 p-2 rounded">
                    <Database size={20}/>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{addon.name}</p>
                    <p className="text-xs text-gray-500">{addon.plan} • {addon.status}</p>
                  </div>
                </div>
                <button className="text-sm text-gray-400 hover:text-gray-600">Settings</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMarketplace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add-ons Marketplace</h2>
              <button onClick={() => setShowMarketplace(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24}/>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {catalog.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-[#79589F] transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-gray-100 p-2 rounded group-hover:bg-purple-50 transition-colors">
                      {item.icon === 'database' && <Database size={20} className="text-gray-600 group-hover:text-[#79589F]"/>}
                      {item.icon === 'zap' && <RefreshCw size={20} className="text-gray-600 group-hover:text-[#79589F]"/>}
                      {item.icon === 'terminal' && <Terminal size={20} className="text-gray-600 group-hover:text-[#79589F]"/>}
                    </div>
                    <button onClick={() => handleProvision(item.id)} className="text-xs font-bold text-[#79589F] uppercase hover:underline">
                      Install
                    </button>
                  </div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DeployTab = ({ app, onDeploy }: { app: App, onDeploy: () => void }) => {
  const [deployMethod, setDeployMethod] = useState<'git' | 'github' | 'url'>('url');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isDeploying, setIsDeploying] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [buildLogs, setBuildLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [lastLiveUrl, setLastLiveUrl] = useState<string | null>(null);

  const fetchReleases = async () => {
    const res = await fetch(`/api/apps/${app.id}/releases`);
    const data = await res.json();
    setReleases(data);
  };

  useEffect(() => {
    fetchReleases();
  }, [app.id]);

  useEffect(() => {
    if (isDeploying && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [buildLogs, isDeploying]);

  const handleDeploy = async () => {
    setBuildLogs([]);
    setIsDeploying(true);
    
    // Setup WebSocket for build logs
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'log' && message.data.appId === app.id && message.data.source === 'build') {
        setBuildLogs(prev => [...prev, message.data]);
        if (message.data.content.includes("App is live")) {
          const urlMatch = message.data.content.match(/https:\/\/[^\s]+/);
          if (urlMatch) setLastLiveUrl(urlMatch[0]);
          setTimeout(() => {
            setIsDeploying(false);
            onDeploy();
            fetchReleases();
            socket.close();
          }, 2000);
        }
      }
    };

    const res = await fetch(`/api/apps/${app.id}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, branch }),
    });
    
    if (!res.ok) {
      setIsDeploying(false);
      socket.close();
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Deployment method</h3>
        </div>
        <div className="flex border-b border-gray-100">
          <button onClick={() => setDeployMethod('github')} className={cn(
            "flex-1 py-4 flex flex-col items-center gap-2 border-r border-gray-100 transition-colors",
            deployMethod === 'github' ? "bg-gray-50" : "hover:bg-gray-50/50"
          )}>
            <Github size={24} className={deployMethod === 'github' ? "text-gray-900" : "text-gray-400"}/>
            <span className={cn("text-sm font-medium", deployMethod === 'github' ? "text-gray-900" : "text-gray-500")}>GitHub</span>
          </button>
          <button onClick={() => setDeployMethod('url')} className={cn(
            "flex-1 py-4 flex flex-col items-center gap-2 border-r border-gray-100 transition-colors",
            deployMethod === 'url' ? "bg-gray-50" : "hover:bg-gray-50/50"
          )}>
            <Cloud size={24} className={deployMethod === 'url' ? "text-gray-900" : "text-gray-400"}/>
            <span className={cn("text-sm font-medium", deployMethod === 'url' ? "text-gray-900" : "text-gray-500")}>Public Git URL</span>
          </button>
          <button onClick={() => setDeployMethod('git')} className={cn(
            "flex-1 py-4 flex flex-col items-center gap-2 transition-colors",
            deployMethod === 'git' ? "bg-gray-50" : "hover:bg-gray-50/50"
          )}>
            <Terminal size={24} className={deployMethod === 'git' ? "text-gray-900" : "text-gray-400"}/>
            <span className={cn("text-sm font-medium", deployMethod === 'git' ? "text-gray-900" : "text-gray-500")}>Bera Git</span>
          </button>
        </div>

        <div className="p-8">
          {deployMethod === 'url' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900">Deploy from Public Git URL</h4>
                <p className="text-sm text-gray-500 mt-1">Paste any public HTTPS Git repository URL to deploy instantly.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                  <input 
                    type="text" 
                    value={repoUrl} 
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch (optional)</label>
                  <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-gray-400"/>
                    <input 
                      type="text" 
                      value={branch} 
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleDeploy} 
                  disabled={isDeploying || !repoUrl} 
                  className="w-full bg-[#79589F] hover:bg-[#6a4d8c] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isDeploying ? <RefreshCw className="animate-spin" size={20}/> : <Upload size={20}/>}
                  {isDeploying ? "Deploying..." : "Deploy Branch"}
                </button>
              </div>

              {lastLiveUrl && !isDeploying && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <ExternalLink size={20}/>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-900">Deployment Successful!</h4>
                      <p className="text-xs text-emerald-700">Your app is now live at the URL below.</p>
                    </div>
                  </div>
                  <a href={lastLiveUrl} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-colors">
                    Open App
                  </a>
                </motion.div>
              )}

              {isDeploying && (
                <div className="mt-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
                  <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"/>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                      <div className="w-3 h-3 rounded-full bg-green-500"/>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">build-log --app {app.name}</span>
                  </div>
                  <div className="p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto space-y-1">
                    {buildLogs.length === 0 ? (
                      <div className="text-gray-500 italic">Initializing build environment...</div>
                    ) : (
                      buildLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-gray-600 shrink-0">{i + 1}</span>
                          <span className="break-all">{log.content}</span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {deployMethod === 'git' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h4 className="font-medium text-gray-900">Deploy with Bera Git</h4>
              <p className="text-sm text-gray-500">Use the Bera CLI to push your code directly to our servers.</p>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm space-y-2">
                <p>$ bera login</p>
                <p>$ bera git:remote -a {app.name}</p>
                <p>$ git push bera main</p>
              </div>
            </div>
          )}

          {deployMethod === 'github' && (
            <div className="text-center py-8">
              <Github size={48} className="mx-auto text-gray-300 mb-4"/>
              <h4 className="font-medium text-gray-900">Connect to GitHub</h4>
              <p className="text-sm text-gray-500 mt-1">Authorize Bera Host to access your repositories.</p>
              <button className="mt-6 px-6 py-2 bg-gray-900 text-white rounded font-medium hover:bg-black transition-colors flex items-center gap-2 mx-auto">
                <Github size={18}/> Connect to GitHub
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Build history</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {releases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No builds yet.</div>
          ) : (
            releases.map((release) => (
              <div key={release.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full", 
                    release.status === 'succeeded' ? "bg-emerald-500" : "bg-red-500"
                  )}/>
                  <div>
                    <p className="font-medium text-gray-900">v{release.version} - {release.description}</p>
                    <p className="text-xs text-gray-500">{format(new Date(release.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <button className="text-sm text-[#79589F] font-medium hover:underline">View build log</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const MetricsTab = ({ app }: { app: App }) => {
  // Mock data for charts
  const data = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    responseTime: Math.floor(Math.random() * 200) + 100,
    requests: Math.floor(Math.random() * 50) + 10,
    memory: Math.floor(Math.random() * 100) + 200,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Response Time (ms)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#79589F" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#79589F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="time" hide/>
                <YAxis hide/>
                <Tooltip/>
                <Area type="monotone" dataKey="responseTime" stroke="#79589F" fillOpacity={1} fill="url(#colorRes)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Throughput (req/s)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="time" hide/>
                <YAxis hide/>
                <Tooltip/>
                <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Memory Usage (MB)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
              <XAxis dataKey="time" hide/>
              <YAxis hide/>
              <Tooltip/>
              <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ActivityTab = ({ app, compact }: { app: App, compact?: boolean }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    fetch(`/api/apps/${app.id}/activity`)
      .then(res => res.json())
      .then(setEvents);
  }, [app.id]);

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet.</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                {event.action.includes('deploy') ? <RefreshCw size={14}/> : <Database size={14}/>}
              </div>
              <div className="flex-1 w-px bg-gray-200 my-1"/>
            </div>
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {event.description}
                </p>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                  {event.action}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                by {event.actor} • {format(new Date(event.timestamp), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const SettingsTab = ({ app, onDelete }: { app: App, onDelete: () => void }) => {
  const [configVars, setConfigVars] = useState<ConfigVar[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showReleaseToast, setShowReleaseToast] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const fetchConfig = async () => {
    const res = await fetch(`/api/apps/${app.id}/config`);
    const data = await res.json();
    setConfigVars(data);
  };

  useEffect(() => {
    fetchConfig();
  }, [app.id]);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    
    const res = await fetch(`/api/apps/${app.id}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey, value: newValue }),
    });
    
    if (res.ok) {
      setNewKey('');
      setNewValue('');
      fetchConfig();
      setShowReleaseToast(true);
      setTimeout(() => setShowReleaseToast(false), 5000);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    const res = await fetch(`/api/config/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchConfig();
      setShowReleaseToast(true);
      setTimeout(() => setShowReleaseToast(false), 5000);
    }
  };

  const handleDeleteApp = async () => {
    if (confirm('Are you sure you want to delete this app? This cannot be undone.')) {
      await fetch(`/api/apps/${app.id}`, { method: 'DELETE' });
      onDelete();
    }
  };

  return (
    <div className="space-y-8 relative">
      {showReleaseToast && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: 20 }} 
          className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-50 border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          <div>
            <p className="text-sm font-bold">New Release Created</p>
            <p className="text-xs text-gray-400">Config var changes triggered a new release.</p>
          </div>
          <button onClick={() => setShowReleaseToast(false)} className="ml-4 text-gray-500 hover:text-white">
            <X size={16}/>
          </button>
        </motion.div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Config Vars</h3>
            <p className="text-xs text-gray-500 mt-1">Environment variables for your application.</p>
          </div>
          <button onClick={() => setIsRevealed(!isRevealed)} className="text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium flex items-center gap-2">
            {isRevealed ? <EyeOff size={16}/> : <Eye size={16}/>}
            {isRevealed ? 'Hide Config Vars' : 'Reveal Config Vars'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Key</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configVars.map((v) => (
                <tr key={v.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-gray-700">{v.key}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        type={isRevealed ? "text" : "password"} 
                        value={v.value} 
                        className="flex-1 bg-transparent border-none p-0 text-sm font-mono text-gray-600 focus:ring-0"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteConfig(v.id)} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50/30">
                <td className="px-6 py-4" colSpan={3}>
                  <form onSubmit={handleAddConfig} className="flex gap-4">
                    <input 
                      placeholder="KEY (e.g. API_KEY)" 
                      value={newKey} 
                      onChange={e => setNewKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 bg-white" 
                    />
                    <input 
                      placeholder="VALUE" 
                      value={newValue} 
                      onChange={e => setNewValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 bg-white" 
                    />
                    <button 
                      type="submit" 
                      disabled={!newKey || !newValue} 
                      className="bg-gray-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Domains</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <span className="text-sm font-medium text-gray-700">berahost.up.railway.app/{app.id}</span>
            <span className="text-xs text-gray-500 uppercase">Default</span>
          </div>
          <button className="mt-4 text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium">Add domain</button>
        </div>
      </section>

      <section className="bg-red-50 rounded-lg border border-red-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100">
          <h3 className="font-semibold text-red-800">Danger Zone</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Delete this app</h4>
            <p className="text-sm text-gray-500">Once deleted, your app and all its data are gone forever.</p>
          </div>
          <button onClick={handleDeleteApp} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors">
            Delete App
          </button>
        </div>
      </section>
    </div>
  );
};

const CLIPage = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F7F9]">
      <TopBar title="CLI Documentation"/>
      <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <section className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Bera CLI</h2>
          <p className="text-gray-600 mb-6">
            The Bera CLI is the primary tool for managing your applications from the command line. 
            It allows you to create apps, manage configuration, view logs, and scale your dynos.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Installation</h3>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                $ npm install -g bera-cli
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Commands</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span className="font-mono text-sm font-bold text-[#79589F]">bera login</span>
                  <span className="col-span-2 text-sm text-gray-600">Log in to your Bera Host account</span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span className="font-mono text-sm font-bold text-[#79589F]">bera create [name]</span>
                  <span className="col-span-2 text-sm text-gray-600">Create a new application</span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span className="font-mono text-sm font-bold text-[#79589F]">bera logs --tail</span>
                  <span className="col-span-2 text-sm text-gray-600">Stream real-time logs</span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span className="font-mono text-sm font-bold text-[#79589F]">bera ps:scale web=2</span>
                  <span className="col-span-2 text-sm text-gray-600">Scale your web dynos</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const AddonsPage = () => {
  const [catalog, setCatalog] = useState<AddonCatalogItem[]>([]);

  useEffect(() => {
    fetch('/api/addons/catalog').then(res => res.json()).then(setCatalog);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7F9]">
      <TopBar title="Add-ons Marketplace"/>
      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalog.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-[#79589F] mb-4">
                {item.icon === 'database' && <Database size={24}/>}
                {item.icon === 'zap' && <RefreshCw size={24}/>}
                {item.icon === 'terminal' && <Terminal size={24}/>}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-2 mb-4">{item.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">{item.category}</span>
                <button className="text-sm font-bold text-[#79589F] hover:underline">Learn more</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#F5F7F9]">
        <Routes>
          <Route path="/apps/:id/logs" element={<LogsPage />} />
          <Route path="*" element={
            <>
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/apps/:id" element={<AppDetail />} />
                  <Route path="/addons" element={<AddonsPage />} />
                  <Route path="/cli" element={<CLIPage />} />
                </Routes>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}
