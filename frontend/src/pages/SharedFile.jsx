import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSharedFileApi } from '../api/fileApi';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Download,
  Lock,
  Clock,
  Eye,
  AlertCircle,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

export const SharedFile = () => {
  const { shareToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const fetchSharedFile = async (password = '') => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getSharedFileApi(shareToken, password);

      if (res.success) {
        if (res.isPasswordProtected && !res.file) {
          setIsPasswordProtected(true);
          setFileData({ name: res.name, mimeType: res.mimeType, formattedSize: res.formattedSize });
        } else {
          setIsPasswordProtected(false);
          setFileData(res.file);
        }
      }
    } catch (err) {
      console.error('Failed to fetch shared file:', err);
      const msg = err.response?.data?.message || 'Shared file link is invalid or expired.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setUnlocking(false);
    }
  };

  useEffect(() => {
    if (shareToken) {
      fetchSharedFile();
    }
  }, [shareToken]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      toast.error('Please enter the password');
      return;
    }
    setUnlocking(true);
    fetchSharedFile(passwordInput.trim());
  };

  const getFileIcon = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-10 h-10 text-purple-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-10 h-10 text-rose-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-10 h-10 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-10 h-10 text-amber-500" />;
    return <FileText className="w-10 h-10 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Dynamic Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-bold">
            CD
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            CloudDocs <span className="text-blue-500 font-normal">AI</span>
          </span>
        </div>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl"
        >
          Sign In
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full my-auto py-12 relative z-10">
        {loading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400 font-medium">Decrypting share link...</p>
          </div>
        ) : errorMsg ? (
          /* Error / Expired View */
          <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 md:p-10 text-center shadow-2xl backdrop-blur-xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">{errorMsg}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
            >
              Go to Home Page
            </Link>
          </div>
        ) : isPasswordProtected ? (
          /* Password Protected Card */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Password Protected File</h2>
              <p className="text-xs text-slate-400">
                The owner has secured <strong className="text-slate-200">{fileData?.name}</strong> with a password.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Access Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter file password..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 transition-all placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={unlocking}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {unlocking ? 'Verifying Password...' : 'Unlock & Access File'}
              </button>
            </form>
          </div>
        ) : (
          /* Shared File View Card */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                {getFileIcon(fileData?.mimeType)}
              </div>
              <div className="space-y-1 truncate">
                <h2 className="text-xl font-bold text-white tracking-tight truncate" title={fileData?.name}>
                  {fileData?.name}
                </h2>
                <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                  <span>{fileData?.formattedSize}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>{fileData?.views || 1} views</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Image Preview if image */}
            {fileData?.mimeType?.startsWith('image/') && fileData?.downloadUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-72 flex items-center justify-center">
                <img
                  src={fileData.downloadUrl}
                  alt={fileData.name}
                  className="max-h-72 object-contain w-full"
                />
              </div>
            )}

            {/* Expiration Note */}
            {fileData?.expiresAt && (
              <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Link expires on {new Date(fileData.expiresAt).toLocaleString()}</span>
              </div>
            )}

            {/* Folder Files List or Download Button */}
            {fileData?.isFolder && fileData?.folderFiles && fileData.folderFiles.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Files inside directory ({fileData.folderFiles.length})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {fileData.folderFiles.map((child) => (
                    <div
                      key={child._id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        {getFileIcon(child.mimeType)}
                        <div className="truncate">
                          <p className="text-sm font-semibold text-white truncate" title={child.name}>
                            {child.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{child.formattedSize}</p>
                        </div>
                      </div>
                      {child.downloadUrl ? (
                        <a
                          href={child.downloadUrl}
                          download={child.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500">No Download</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : fileData?.allowDownload && fileData?.downloadUrl ? (
              <a
                href={fileData.downloadUrl}
                download={fileData.name}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>Download File ({fileData.formattedSize})</span>
              </a>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Direct file download is disabled by the file owner.
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted & Verified by CloudDocs AI Security</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-slate-500 border-t border-slate-800/60 relative z-10">
        © {new Date().getFullYear()} CloudDocs AI. Powered by AWS S3 & Secure Cloud Architecture.
      </footer>
    </div>
  );
};
