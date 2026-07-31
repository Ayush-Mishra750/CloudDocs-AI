import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSharingDashboardApi } from '../api/shareApi';
import { ShareModal } from '../components/share/ShareModal';
import {
  Share2,
  Users,
  ArrowRight,
  Settings,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const ShareDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getSharingDashboardApi();
      if (res.success) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load sharing dashboard metrics:', err);
      toast.error('Failed to load sharing dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <span>Loading sharing dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-slate-900">
      {/* Top Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">File Sharing Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your shared files and collaborations seamlessly</p>
        </div>
        <div className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Top 3 Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Shared With Me */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-slate-900">{metrics?.sharedWithMeCount ?? 0}</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Shared With Me</h3>
            <p className="text-xs text-slate-400 font-medium">Files others have shared</p>
          </div>

          <button
            onClick={() => navigate('/share/shared-with-me')}
            className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <span>View All Files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Shared By Me */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-slate-900">{metrics?.sharedByMeCount ?? 0}</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Shared By Me</h3>
            <p className="text-xs text-slate-400 font-medium">Files you've shared</p>
          </div>

          <button
            onClick={() => navigate('/share/shared-by-me')}
            className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Manage Files</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Collaborators */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-slate-900 block">{metrics?.collaboratorsCount ?? 0}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Active users</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Collaborators</h3>
            <p className="text-xs text-slate-400 font-medium">People you work with</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Recent Activity</h2>
          <p className="text-xs text-slate-400 font-medium">Your latest shared files and collaborations</p>
        </div>

        <div className="space-y-3">
          {metrics?.recentActivity?.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No recent sharing activity</div>
          ) : (
            metrics?.recentActivity?.map((activity) => (
              <div
                key={activity._id}
                className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{activity.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{activity.label}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-[11px] text-slate-400 font-medium">{formatRelativeTime(activity.updatedAt)}</span>
                  <button
                    onClick={() => setSelectedFileForShare(activity)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Share Modal */}
      {selectedFileForShare && (
        <ShareModal
          file={selectedFileForShare}
          isOpen={!!selectedFileForShare}
          onClose={() => setSelectedFileForShare(null)}
          onUpdate={fetchDashboardData}
        />
      )}
    </div>
  );
};
