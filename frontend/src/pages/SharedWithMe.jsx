import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getFilesSharedWithMeApi } from '../api/shareApi';
import {
  ArrowLeft,
  Users,
  Search,
  Eye,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  File,
  Folder,
  Download,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  Globe,
} from 'lucide-react';

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Recently';
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

const getFileCategory = (file) => {
  if (file?.isFolder) return 'folder';
  const mime = (file?.mimeType || '').toLowerCase();
  const name = (file?.name || file?.originalName || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return 'image';
  if (mime === 'application/pdf' || mime.includes('pdf') || /\.pdf$/i.test(name)) return 'pdf';
  if (mime.startsWith('video/') || /\.(mp4|webm|ogg|mov|mkv|avi)$/i.test(name)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(name)) return 'audio';
  if (mime.includes('text') || mime.includes('json') || mime.includes('markdown') || /\.(txt|md|json|js|jsx|ts|tsx|html|css|py)$/i.test(name)) return 'text';
  return 'other';
};

export const SharedWithMe = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const fetchSharedWithMe = async () => {
    try {
      setLoading(true);
      const res = await getFilesSharedWithMeApi();
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch files shared with me:', err);
      toast.error('Failed to load shared files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedWithMe();
  }, []);

  const filteredFiles = files.filter(
    (f) =>
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (file) => {
    const category = getFileCategory(file);
    if (category === 'folder') return <Folder className="w-5 h-5 text-cyan-600" />;
    if (category === 'image') return <FileImage className="w-5 h-5 text-emerald-600" />;
    if (category === 'pdf') return <FileText className="w-5 h-5 text-rose-600" />;
    if (category === 'text') return <FileText className="w-5 h-5 text-amber-600" />;
    if (category === 'video') return <FileVideo className="w-5 h-5 text-purple-600" />;
    if (category === 'audio') return <FileAudio className="w-5 h-5 text-rose-500" />;
    return <File className="w-5 h-5 text-blue-600" />;
  };

  const handleOpenFile = (file) => {
    setImageLoadError(false);
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <span>Loading files shared with you...</span>
      </div>
    );
  }

  const selectedCategory = selectedFile ? getFileCategory(selectedFile) : null;
  const fileUrl = selectedFile ? (selectedFile.downloadUrl || selectedFile.s3Url) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900 relative">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/share')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Files Shared with Me</h1>
            <p className="text-xs text-slate-500 font-medium">Access files others have shared with you</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{files.length} items</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Search Input & Filter Dropdown Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search files or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-700 font-bold flex items-center space-x-2 shadow-sm self-end sm:self-auto">
          <span>All Items ({files.length})</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* File List Cards */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200/90 shadow-sm">
            No files shared with you yet.
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50/70 flex items-center justify-center shrink-0">
                  {getFileIcon(file)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{file.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold border border-blue-200 capitalize">
                      {file.myRole || file.permission || 'Viewer'}
                    </span>
                    {file.isPublic && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    Shared by <strong className="text-slate-600">{file.owner?.name || 'Collaborator'}</strong> • {file.isFolder ? 'Folder' : file.formattedSize} • {formatRelativeTime(file.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Actions & Owner Avatar */}
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <div
                  className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase border border-slate-200 shadow-sm"
                  title={`Owner: ${file.owner?.name || 'User'}`}
                >
                  {file.owner?.name?.slice(0, 2) || 'OW'}
                </div>

                <button
                  onClick={() => handleOpenFile(file)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View File</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rich Document Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  {getFileIcon(selectedFile)}
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold text-slate-900 truncate">{selectedFile.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Shared by {selectedFile.owner?.name || 'Owner'} • {selectedFile.isFolder ? 'Folder' : selectedFile.formattedSize}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Image Preview Box */}
            {selectedCategory === 'image' && fileUrl && !imageLoadError && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 max-h-72 flex items-center justify-center p-2">
                <img
                  src={fileUrl}
                  alt={selectedFile.name}
                  onError={() => setImageLoadError(true)}
                  className="max-h-64 object-contain rounded-xl w-full"
                />
              </div>
            )}

            {/* Image Error Fallback */}
            {selectedCategory === 'image' && imageLoadError && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <FileImage className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-bold">Image preview unavailable inline</p>
                <p className="text-[11px] text-slate-400">Use the buttons below to open or download the image.</p>
              </div>
            )}

            {/* PDF Preview Box */}
            {selectedCategory === 'pdf' && fileUrl && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 h-64">
                <iframe
                  src={fileUrl}
                  className="w-full h-full"
                  title={selectedFile.name}
                />
              </div>
            )}

            {/* Video Preview Box */}
            {selectedCategory === 'video' && fileUrl && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-black max-h-64 flex items-center justify-center">
                <video
                  src={fileUrl}
                  controls
                  className="max-h-64 w-full"
                />
              </div>
            )}

            {/* Audio Preview Box */}
            {selectedCategory === 'audio' && fileUrl && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <audio
                  src={fileUrl}
                  controls
                  className="w-full"
                />
              </div>
            )}

            {/* Folder Information Box */}
            {selectedCategory === 'folder' && (
              <div className="p-6 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl text-center space-y-2">
                <Folder className="w-12 h-12 text-cyan-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">{selectedFile.name}</h3>
                <p className="text-xs text-slate-500">Shared directory by {selectedFile.owner?.name || 'Collaborator'}</p>
              </div>
            )}

            {/* Other Document Box */}
            {(selectedCategory === 'text' || selectedCategory === 'other') && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">{selectedFile.name}</h3>
                <p className="text-xs text-slate-500">Shared document file ({selectedFile.formattedSize})</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="space-y-2.5 pt-2">
              {fileUrl ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Open in Tab</span>
                  </a>

                  <a
                    href={fileUrl}
                    download={selectedFile.name}
                    className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              ) : null}

              {selectedFile.shareToken && (
                <button
                  onClick={() => {
                    const token = selectedFile.shareToken;
                    setSelectedFile(null);
                    navigate(`/guest/access/${token}`);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Open Public Share Access Page</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
