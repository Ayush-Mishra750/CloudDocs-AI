import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getRegisteredUsersApi,
  toggleShareLinkApi,
  inviteCollaboratorApi,
  removeCollaboratorApi,
  updateCollaboratorRoleApi,
} from '../../api/shareApi';
import {
  Share2,
  Link,
  Mail,
  Users,
  X,
  Check,
  Copy,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  RefreshCw,
  Globe,
  ShieldCheck,
} from 'lucide-react';

export const ShareModal = ({ file, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link', 'invite', 'shared'
  const [isPublic, setIsPublic] = useState(file?.isPublic || false);
  const [permissionLevel, setPermissionLevel] = useState(file?.publicPermission || 'viewer');
  const [shareToken, setShareToken] = useState(file?.shareToken || '');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [sharedWithList, setSharedWithList] = useState(file?.sharedWith || []);
  const [loading, setLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (file) {
      setIsPublic(file.isPublic || false);
      setPermissionLevel(file.publicPermission || 'viewer');
      setShareToken(file.shareToken || '');
      setSharedWithList(file.sharedWith || []);
    }
  }, [file]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await getRegisteredUsersApi();
      if (res.success) {
        setRegisteredUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load registered users:', err);
    }
  };

  if (!isOpen || !file) return null;

  const publicLink = shareToken
    ? `${window.location.origin}/guest/access/${shareToken}`
    : `${window.location.origin}/guest/access/${file._id}`;

  // Handle Link Sharing Toggle
  const handleToggleLinkSharing = async (newVal) => {
    try {
      setLoading(true);
      const res = await toggleShareLinkApi(file._id, {
        isPublic: newVal,
        publicPermission: permissionLevel,
      });

      if (res.success) {
        setIsPublic(newVal);
        setShareToken(res.shareToken);
        toast.success(res.message);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to update link sharing settings.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Share link copied to clipboard!', { icon: '📋' });
  };

  // Handle Send Invite
  const handleSendInvite = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to invite.');
      return;
    }

    try {
      setLoading(true);
      const res = await inviteCollaboratorApi(file._id, {
        userIdToInvite: selectedUser._id,
        role: selectedRole,
      });

      if (res.success) {
        toast.success(res.message);
        setSharedWithList(res.sharedWith || []);
        setSelectedUser(null);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Remove Collaborator
  const handleRemoveCollaborator = async (targetUserId) => {
    try {
      const res = await removeCollaboratorApi(file._id, targetUserId);
      if (res.success) {
        toast.success('Access revoked.');
        setSharedWithList(res.sharedWith || []);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to revoke access.');
    }
  };

  // Handle Change Role
  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      const res = await updateCollaboratorRoleApi(file._id, targetUserId, newRole);
      if (res.success) {
        toast.success('Collaborator role updated.');
        setSharedWithList((prev) =>
          prev.map((sw) =>
            (sw.user._id || sw.user) === targetUserId ? { ...sw, role: newRole } : sw
          )
        );
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header (Matching Reference Image 4 & 5) */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Share Document</h3>
              <p className="text-xs text-slate-400 font-medium">Collaborate with others</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Row (Share Link | Email Invite | Shared With) */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`py-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'invite'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Invite</span>
          </button>

          <button
            onClick={() => setActiveTab('shared')}
            className={`py-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'shared'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Shared With ({sharedWithList.length})</span>
          </button>
        </div>

        {/* Tab 1: Share Link (Image #5) */}
        {activeTab === 'link' && (
          <div className="p-6 space-y-6">
            {/* Toggle Share with Link */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Share with link</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Anyone with the link can access</p>
                </div>
              </div>

              {/* iOS Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleLinkSharing(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 relative ${
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

            {/* Permission Level Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Permission level</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPermissionLevel('viewer')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    permissionLevel === 'viewer'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Viewer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPermissionLevel('editor')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    permissionLevel === 'editor'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  <span>Editor</span>
                </button>
              </div>
            </div>

            {/* Share Link Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Share link</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Email Invite (Image #4) */}
        {activeTab === 'invite' && (
          <div className="p-6 space-y-6">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-700">Select users to invite</label>
              <div
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full bg-white border border-blue-500 rounded-2xl p-3 text-xs text-slate-600 flex items-center justify-between cursor-pointer shadow-sm"
              >
                <span>{selectedUser ? selectedUser.name : 'Choose users to invite'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Users Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {registeredUsers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No other users registered</div>
                  ) : (
                    registeredUsers.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-blue-50 flex items-center space-x-3 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                          {u.name?.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected User Preview Box */}
            {selectedUser && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Selected users (1)</label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {selectedUser.name?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedUser.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex bg-white rounded-xl p-0.5 border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('viewer')}
                        className={`px-2.5 py-1 rounded-lg ${
                          selectedRole === 'viewer' ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        Viewer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('editor')}
                        className={`px-2.5 py-1 rounded-lg ${
                          selectedRole === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        Editor
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Send Invite Action Button */}
            <button
              type="button"
              onClick={handleSendInvite}
              disabled={loading || !selectedUser}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Send 1 Invite</span>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Shared With List (Image #1) */}
        {activeTab === 'shared' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-black tracking-wide text-slate-900">Users with Access</h4>
            </div>

            {sharedWithList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No collaborators added yet. Use Email Invite to share.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {sharedWithList.map((sw, idx) => {
                  const collaborator = sw.user;
                  if (!collaborator) return null;

                  const isEditor = (sw.role || 'editor').toLowerCase() === 'editor';
                  const formattedDate = sw.sharedAt
                    ? new Date(sw.sharedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                  return (
                    <div
                      key={collaborator._id || idx}
                      className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {collaborator.name?.slice(0, 2) || 'U'}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                            {collaborator.name}
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium">{collaborator.email}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Shared on {formattedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 capitalize ${
                          isEditor
                            ? 'bg-amber-100/90 text-amber-800 border-amber-200/80'
                            : 'bg-blue-100/90 text-blue-800 border-blue-200/80'
                        }`}>
                          {isEditor ? (
                            <Edit className="w-3 h-3 text-amber-700" />
                          ) : (
                            <Eye className="w-3 h-3 text-blue-700" />
                          )}
                          <span>{sw.role || 'Viewer'}</span>
                        </span>

                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>

                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collaborator._id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        )}
      </div>
    </div>
  );
};
