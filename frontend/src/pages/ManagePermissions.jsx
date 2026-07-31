import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  toggleShareLinkApi,
  removeCollaboratorApi,
  updateCollaboratorRoleApi,
} from '../api/shareApi';
import api from '../api/axiosInstance';
import {
  ArrowLeft,
  Settings,
  Link,
  Users,
  Trash2,
  Globe,
  RefreshCw,
  FileText,
  Copy,
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

export const ManagePermissions = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [sharedWithList, setSharedWithList] = useState([]);

  const fetchFileDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/files/${fileId}`);
      if (res.data?.success) {
        const fetchedFile = res.data.file;
        setFile(fetchedFile);
        setIsPublic(fetchedFile.isPublic || false);
        setSharedWithList(fetchedFile.sharedWith || []);
      }
    } catch (err) {
      console.error('Failed to load file details:', err);
      toast.error('Failed to load permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchFileDetails();
    }
  }, [fileId]);

  // Handle Link Sharing Toggle
  const handleToggleLinkSharing = async (newVal) => {
    try {
      const res = await toggleShareLinkApi(fileId, {
        isPublic: newVal,
        publicPermission: file?.publicPermission || 'viewer',
      });

      if (res.success) {
        setIsPublic(newVal);
        toast.success(res.message);
        await fetchFileDetails();
      }
    } catch (err) {
      toast.error('Failed to update link sharing.');
    }
  };

  // Handle Remove Collaborator
  const handleRemoveCollaborator = async (targetUserId) => {
    try {
      const res = await removeCollaboratorApi(fileId, targetUserId);
      if (res.success) {
        toast.success('Access revoked.');
        await fetchFileDetails();
      }
    } catch (err) {
      toast.error('Failed to revoke access.');
    }
  };

  // Handle Update Role
  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      const res = await updateCollaboratorRoleApi(fileId, targetUserId, newRole);
      if (res.success) {
        toast.success('Collaborator role updated.');
        if (res.sharedWith) {
          setSharedWithList(res.sharedWith);
        } else {
          await fetchFileDetails();
        }
      }
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <span>Loading permissions...</span>
      </div>
    );
  }

  const publicLink = `${window.location.origin}/guest/access/${file?.shareToken || file?._id}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/share/shared-by-me')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Manage Permissions</h1>
            <p className="text-xs text-slate-500 font-medium">{file?.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{sharedWithList.length} users</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* File Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center space-x-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{file?.name}</h3>
          <p className="text-xs text-slate-400 font-medium">{file?.formattedSize} • Modified {formatRelativeTime(file?.updatedAt)}</p>
        </div>
      </div>

      {/* Link Sharing Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <Link className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base text-slate-900">Link Sharing</h3>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Share with link</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {isPublic ? 'Anyone with the link can access' : 'Link sharing is currently disabled'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleLinkSharing(!isPublic)}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 relative self-end sm:self-auto ${
              isPublic ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {isPublic && (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                toast.success('Link copied!');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        )}
      </div>

      {/* Shared Users List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-base text-slate-900">Shared Users ({sharedWithList.length})</h3>
        </div>

        {sharedWithList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No users have direct access to this file yet.</div>
        ) : (
          <div className="space-y-3">
            {sharedWithList.map((sw, idx) => {
              const collaborator = sw.user || sw.userId;
              if (!collaborator) return null;
              const collabId = collaborator._id || collaborator;
              const currentRole = sw.permission || sw.role || 'viewer';

              return (
                <div
                  key={collabId || idx}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {collaborator.name?.slice(0, 2) || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{collaborator.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            currentRole === 'editor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {currentRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{collaborator.email} • Shared access</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <select
                      value={currentRole}
                      onChange={(e) => handleChangeRole(collabId, e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="editor">Can Edit</option>
                      <option value="viewer">Can View</option>
                    </select>

                    <button
                      onClick={() => handleRemoveCollaborator(collabId)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
