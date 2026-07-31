import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const fetchSystemHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const SystemStatus = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchSystemHealth,
    refetchInterval: 10000, // Auto-refetch every 10s
  });

  const getBadge = (status) => {
    if (status === 'connected' || status === 'healthy') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Disconnected</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            <span>System Infrastructure Health</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status monitoring for Express API backend, MongoDB instance, and Redis cluster.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Health Status</span>
        </button>
      </div>

      {/* Main Status Cards */}
      {isLoading ? (
        <div className="p-12 rounded-2xl glass-card text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-400">Connecting to CloudDocs backend service...</p>
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-slate-200 space-y-3">
          <div className="flex items-center space-x-3 text-rose-400 font-bold text-lg">
            <AlertTriangle className="w-6 h-6" />
            <span>Backend Service Unreachable</span>
          </div>
          <p className="text-sm text-slate-400">
            Could not communicate with Express API at <code className="text-indigo-300">http://localhost:5000/api/v1/health</code>. Ensure docker-compose backend container is running.
          </p>
          <p className="text-xs text-rose-300/80">Error: {error?.message}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Health Banner */}
          <div className={`p-6 rounded-2xl glass-panel border ${
            data?.status === 'healthy'
              ? 'border-emerald-500/30 bg-emerald-950/10'
              : 'border-amber-500/30 bg-amber-950/10'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                data?.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  System Status: <span className="capitalize">{data?.status}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Last verified: {new Date(data?.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Backend Uptime: <strong className="text-slate-200">{Math.floor(data?.uptime || 0)}s</strong></span>
            </div>
          </div>

          {/* Service breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Express Service */}
            <div className="p-6 rounded-2xl glass-card space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                {getBadge('healthy')}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Express Backend</h3>
                <p className="text-xs text-slate-400 mt-1">Node.js ES-Module Server</p>
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 space-y-1">
                <div>Port: <span className="text-slate-200">5000</span></div>
                <div>Status Code: <span className="text-emerald-400 font-mono">200 OK</span></div>
              </div>
            </div>

            {/* MongoDB Service */}
            <div className="p-6 rounded-2xl glass-card space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                {getBadge(data?.services?.mongo)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">MongoDB Database</h3>
                <p className="text-xs text-slate-400 mt-1">Mongoose Connection</p>
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 space-y-1">
                <div>Container: <span className="text-slate-200">mongo:7</span></div>
                <div>State: <span className="text-slate-200 font-mono">{data?.services?.mongo}</span></div>
              </div>
            </div>

            {/* Redis Service */}
            <div className="p-6 rounded-2xl glass-card space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Database className="w-5 h-5" />
                </div>
                {getBadge(data?.services?.redis)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Redis Cache</h3>
                <p className="text-xs text-slate-400 mt-1">IORedis Client (PING check)</p>
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 space-y-1">
                <div>Container: <span className="text-slate-200">redis:7-alpine</span></div>
                <div>State: <span className="text-slate-200 font-mono">{data?.services?.redis}</span></div>
              </div>
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Raw API Health Endpoint Payload</h3>
            <pre className="p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
