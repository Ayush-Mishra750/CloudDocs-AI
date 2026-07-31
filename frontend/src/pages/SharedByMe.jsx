import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getFilesSharedByMeApi } from '../api/shareApi';
import { ShareModal } from '../components/share/ShareModal';
import {
  ArrowLeft,
  Share2,
  Search,
  Settings,
  Eye,
  Video,
  FileText,
  File,
  RefreshCw,
  Globe,
  Users,
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

export const SharedByMe = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);

  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      const res = await getFilesSharedByMeApi();
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch shared files:', err);
      toast.error('Failed to load shared files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mimeType = '') => {
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-600" />;
    if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('markdown'))
      return <FileText className="w-5 h-5 text-amber-600" />;
    return <File className="w-5 h-5 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <span>Loading files shared by you...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/share')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Files Shared by Me</h1>
            <p className="text-xs text-slate-500 font-medium">Manage and track files you've shared with others</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{files.length} files</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search your shared files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Shared Files List Cards */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200/90 shadow-sm">
            No shared files found.
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              {/* File Row Main Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{file.name}</h3>
                      {file.isPublic && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold border border-blue-200 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Public link</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
                      <span>{file.formattedSize}</span>
                      <span>•</span>
                      {file.sharedWith?.length > 0 && (
                        <>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{file.sharedWith.length} people</span>
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>Modified {formatRelativeTime(file.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => setSelectedFileForShare(file)}
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center space-x-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </button>

                  <button
                    onClick={() => navigate(`/share/manage/${file._id}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </div>
              </div>

              {/* Shared With Chips Sub-row */}
              {file.sharedWith?.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500">Shared with:</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {file.sharedWith.map((sw, idx) => {
                      const collaborator = sw.user;
                      if (!collaborator) return null;
                      return (
                        <div
                          key={collaborator._id || idx}
                          className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 flex items-center space-x-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                            {collaborator.name?.slice(0, 2) || 'U'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-none">{collaborator.name}</span>
                            <span className="text-[10px] text-slate-400">{collaborator.email}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                              sw.role === 'editor'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sw.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Share Modal */}
      {selectedFileForShare && (
        <ShareModal
          file={selectedFileForShare}
          isOpen={!!selectedFileForShare}
          onClose={() => setSelectedFileForShare(null)}
          onUpdate={fetchSharedFiles}
        />
      )}
    </div>
  );
};
