import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  getFiles,
  uploadFile,
  createFolder,
  deleteFile,
  renameFileApi,
  toggleStarFileApi,
  trashFileApi,
  restoreFileApi,
  createShareLinkApi,
  revokeShareLinkApi,
  importGoogleDriveFilesApi,
} from '../api/fileApi';
import {
  Upload,
  FolderPlus,
  Search,
  Grid,
  List,
  Folder,
  FolderOpen,
  Home as HomeIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Trash2,
  Download,
  HardDrive,
  RefreshCw,
  ChevronRight,
  Share2,
  Copy,
  Check,
  Lock,
  Star,
  Edit2,
  RotateCcw,
  Globe,
  Link2,
  CheckCircle,
  X,
  SlidersHorizontal,
  Loader2,
  Info,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Navigation Tabs: 'all' | 'starred' | 'trash'
  const [activeTab, setActiveTab] = useState('all');

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Folder navigation state stack
  const [folderPath, setFolderPath] = useState([{ _id: null, name: 'Root' }]);
  const currentFolder = folderPath[folderPath.length - 1];

  const [storage, setStorage] = useState({
    storageUsed: 0,
    storageLimit: 5368709120, // 5GB
    formattedUsed: '0 Bytes',
    formattedLimit: '5 GB',
    percentage: 0,
  });

  // Modal states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [detailsItem, setDetailsItem] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const getFilePathString = (item) => {
    if (!item) return '/root';
    const pathNames = folderPath.map((f, idx) => (idx === 0 ? 'root' : f.name));
    return `/${pathNames.join('/')}/${item.name}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Rename modal state
  const [renameItem, setRenameItem] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Share modal state
  const [shareItem, setShareItem] = useState(null);
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    password: '',
    expiresInHours: 0,
    allowDownload: true,
  });
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharingSaving, setSharingSaving] = useState(false);

  // Google Drive Import States
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [driveViewMode, setDriveViewMode] = useState('grid');
  const [driveAccessToken, setDriveAccessToken] = useState('');
  const [isFetchingDriveFiles, setIsFetchingDriveFiles] = useState(false);

  // Floating upload progress state (Matching Screenshot 1)
  const [isDriveImporting, setIsDriveImporting] = useState(false);
  const [driveImportProgress, setDriveImportProgress] = useState(0);
  const [driveCurrentFileIndex, setDriveCurrentFileIndex] = useState(1);
  const [driveTotalFilesCount, setDriveTotalFilesCount] = useState(1);

  // Success Modal state (Matching Screenshot 2)
  const [showDriveSuccessModal, setShowDriveSuccessModal] = useState(false);

  // Default Google Drive mock items matching Screenshot 3
  const [driveFilesList, setDriveFilesList] = useState([
    {
      id: 'gdrive_file_1',
      name: 'Shubham_Arora_Resume.pdf',
      mimeType: 'application/pdf',
      size: 426210,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_2',
      name: 'Resume.pdf',
      mimeType: 'application/pdf',
      size: 312000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_3',
      name: 'Shubham_Arora_Senior_Frontend.pdf',
      mimeType: 'application/pdf',
      size: 512000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_4',
      name: 'OBS-Studio-32.0.2-Full-Setup.png',
      mimeType: 'image/png',
      size: 10582000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_5',
      name: 'Frontend Development Roadmap',
      mimeType: 'application/vnd.google-apps.document',
      size: 152000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_6',
      name: 'Backend Developer Roadmap',
      mimeType: 'application/vnd.google-apps.document',
      size: 184000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_7',
      name: 'Hemant-Java-Developer.pdf',
      mimeType: 'application/pdf',
      size: 450000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_8',
      name: 'Backend developer architecture.png',
      mimeType: 'image/png',
      size: 852410,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_9',
      name: 'Remove Dots From Image.png',
      mimeType: 'image/png',
      size: 620000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&auto=format&fit=crop&q=60',
    },
    {
      id: 'gdrive_file_10',
      name: 'Generated Image 2026.png',
      mimeType: 'image/png',
      size: 1120000,
      modifiedTime: 'Nov 25, 2025',
      thumbnailLink: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop&q=60',
    },
  ]);

  // Handle Open Drive Picker
  const handleOpenDrivePicker = () => {
    setIsDrivePickerOpen(true);
    setSelectedDriveFiles([]);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              setDriveAccessToken(tokenResponse.access_token);
              fetchLiveGoogleDriveFiles(tokenResponse.access_token);
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch (err) {
        console.error('Google Drive token client error:', err);
      }
    }
  };

  // Fetch live Google Drive files if OAuth token exists
  const fetchLiveGoogleDriveFiles = async (accessToken) => {
    try {
      setIsFetchingDriveFiles(true);
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,size,thumbnailLink,iconLink,modifiedTime)&pageSize=30',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          setDriveFilesList(data.files);
        }
      }
    } catch (err) {
      console.error('Fetch Google Drive files error:', err);
    } finally {
      setIsFetchingDriveFiles(false);
    }
  };

  // Toggle Selection of Drive File
  const handleToggleDriveFileSelect = (file) => {
    setSelectedDriveFiles((prev) => {
      const exists = prev.some((item) => item.id === file.id);
      if (exists) {
        return prev.filter((item) => item.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  // Submit Drive Import
  const handleConfirmDriveImport = async () => {
    if (selectedDriveFiles.length === 0) {
      toast.error('Please select at least one file from Google Drive.');
      return;
    }

    setIsDrivePickerOpen(false);
    setIsDriveImporting(true);
    setDriveImportProgress(15);
    setDriveCurrentFileIndex(1);
    setDriveTotalFilesCount(selectedDriveFiles.length);

    try {
      const progressInterval = setInterval(() => {
        setDriveImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 25;
        });
      }, 400);

      const res = await importGoogleDriveFilesApi({
        files: selectedDriveFiles,
        accessToken: driveAccessToken || 'demo_oauth_token',
      });

      clearInterval(progressInterval);
      setDriveImportProgress(100);

      if (res.success) {
        setTimeout(() => {
          setIsDriveImporting(false);
          setShowDriveSuccessModal(true);
          loadDashboardData();
        }, 500);
      }
    } catch (err) {
      console.error('Drive import error:', err);
      setIsDriveImporting(false);
      toast.error(err.response?.data?.message || 'Failed to import files from Google Drive.');
    }
  };

  const fileInputRef = useRef(null);

  // Load user files & storage statistics from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getFiles({
        search: searchQuery,
        category: categoryFilter,
        isTrash: activeTab === 'trash' ? 'true' : 'false',
        isStarred: activeTab === 'starred' ? 'true' : 'false',
        parentFolder: activeTab === 'all' && currentFolder._id ? currentFolder._id : 'null',
      });
      if (res.success) {
        setFiles(res.files || []);
        if (res.storage) {
          setStorage(res.storage);
        }
      }
    } catch (err) {
      console.error('Failed to load user files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [searchQuery, categoryFilter, folderPath, activeTab]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Navigate into a directory
  const handleOpenFolder = (folder) => {
    if (activeTab !== 'all') return;
    setFolderPath((prev) => [...prev, { _id: folder._id, name: folder.name }]);
  };

  // Navigate back via Breadcrumb index
  const handleNavigateBreadcrumb = (index) => {
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileToUpload = selectedFiles[0];

    try {
      setUploading(true);
      setUploadProgress(0);

      const toastId = toast.loading(`Uploading "${fileToUpload.name}"...`);

      const res = await uploadFile(
        fileToUpload,
        (progress) => setUploadProgress(progress),
        currentFolder._id
      );

      if (res.success) {
        toast.success(`File "${fileToUpload.name}" uploaded successfully!`, { id: toastId });
        await loadDashboardData();
      }
    } catch (err) {
      console.error('File upload error:', err);
      const message = err.response?.data?.message || 'File upload failed. Please try again.';
      toast.error(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      const res = await createFolder({
        name: newFolderName.trim(),
        parentFolder: currentFolder._id,
      });

      if (res.success) {
        toast.success(`Folder "${res.folder.name}" created!`);
        setNewFolderName('');
        setIsCreatingFolder(false);
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Create folder error:', err);
      toast.error(err.response?.data?.message || 'Failed to create folder');
    }
  };

  // Star / Favorite handler
  const handleToggleStar = async (e, fileId) => {
    e.stopPropagation();
    try {
      const res = await toggleStarFileApi(fileId);
      if (res.success) {
        toast.success(res.message);
        setFiles((prev) =>
          prev.map((item) => (item._id === fileId ? { ...item, isStarred: res.isStarred } : item))
        );
      }
    } catch (err) {
      toast.error('Failed to update favorite status');
    }
  };

  // Soft delete (Trash)
  const handleTrashFile = async (e, fileId) => {
    e.stopPropagation();
    try {
      const res = await trashFileApi(fileId);
      if (res.success) {
        toast.success(res.message);
        loadDashboardData();
      }
    } catch (err) {
      toast.error('Failed to move to trash');
    }
  };

  // Restore from Trash
  const handleRestoreFile = async (e, fileId) => {
    e.stopPropagation();
    try {
      const res = await restoreFileApi(fileId);
      if (res.success) {
        toast.success(res.message);
        loadDashboardData();
      }
    } catch (err) {
      toast.error('Failed to restore item');
    }
  };

  // Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await deleteFile(deleteConfirmItem._id);
      if (res.success) {
        toast.success(res.message);
        if (res.storage) setStorage(res.storage);
        setDeleteConfirmItem(null);
        await loadDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  // Rename Handler
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameItem || !renameValue.trim()) return;

    try {
      const res = await renameFileApi(renameItem._id, renameValue.trim());
      if (res.success) {
        toast.success(res.message);
        setRenameItem(null);
        setRenameValue('');
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename item');
    }
  };

  // Share Modal Handlers
  const handleOpenShareModal = (e, file) => {
    e.stopPropagation();
    setShareItem(file);
    setShareSettings({
      isPublic: file.isPublic || false,
      password: '',
      expiresInHours: 0,
      allowDownload: file.allowDownload !== undefined ? file.allowDownload : true,
    });
    const clientUrl = window.location.origin;
    setShareUrl(file.isPublic && file.shareToken ? `${clientUrl}/guest/access/${file.shareToken}` : '');
    setCopied(false);
  };

  const handleSaveShareSettings = async (e) => {
    e.preventDefault();
    if (!shareItem) return;

    try {
      setSharingSaving(true);
      const res = await createShareLinkApi(shareItem._id, shareSettings);
      if (res.success) {
        toast.success(res.message);
        if (res.file?.shareUrl) {
          setShareUrl(res.file.shareUrl);
        } else if (!shareSettings.isPublic) {
          setShareUrl('');
        }
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update share link');
    } finally {
      setSharingSaving(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareItem) return;
    try {
      const res = await revokeShareLinkApi(shareItem._id);
      if (res.success) {
        toast.success(res.message);
        setShareSettings((prev) => ({ ...prev, isPublic: false }));
        setShareUrl('');
        loadDashboardData();
      }
    } catch (err) {
      toast.error('Failed to revoke share link');
    }
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileCategoryBadge = (mimeType = '', isFolder = false) => {
    if (isFolder)
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-100 text-cyan-700">FOLDER</span>;
    if (mimeType.startsWith('image/'))
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700">IMAGE</span>;
    if (mimeType === 'application/pdf')
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700">PDF</span>;
    if (mimeType.startsWith('video/'))
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">VIDEO</span>;
    if (mimeType.startsWith('audio/'))
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">AUDIO</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">DOCUMENT</span>;
  };

  const renderFileIcon = (mimeType = '', isFolder = false) => {
    if (isFolder) return <Folder className="w-8 h-8 text-cyan-500 fill-cyan-50" />;
    if (mimeType.startsWith('image/')) return <FileImage className="w-8 h-8 text-purple-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-amber-500" />;
    return <FileText className="w-8 h-8 text-emerald-500" />;
  };

  const usernameSlug = user?.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'user';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Storage Quota Progress Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/20">
                <HardDrive className="w-3.5 h-3.5" />
                <span>S3 Cloud Vault</span>
              </div>
              {user?.role?.toLowerCase() === 'admin' && (
                <span className="inline-flex items-center space-x-1.5 bg-indigo-500/30 text-indigo-200 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-400/30 tracking-wide uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'User'}!
              </h1>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Manage your files, organize nested directories, and share with public links.
            </p>

            {user?.role?.toLowerCase() === 'admin' && (
              <div className="mt-4">
                <Link
                  to="/admin"
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Admin Control Panel</span>
                </Link>
              </div>
            )}
          </div>

          {/* Storage Meter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-full md:w-80 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Storage Used</span>
              <span className="font-bold text-white">
                {storage.formattedUsed} / {storage.formattedLimit} ({storage.percentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storage.percentage > 85
                    ? 'bg-rose-500'
                    : storage.percentage > 60
                    ? 'bg-amber-400'
                    : 'bg-blue-400'
                }`}
                style={{ width: `${storage.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (Storage, Starred, Trash, Admin) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 flex-wrap gap-y-2">
        <button
          onClick={() => {
            setActiveTab('all');
            setFolderPath([{ _id: null, name: 'Root' }]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>My Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('starred')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'starred'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'trash'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Trash Bin</span>
        </button>

        {user?.role?.toLowerCase() === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all sm:ml-auto"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>

      {/* Upload & Create Directory Banner Box (Only in My Storage tab) */}
      {activeTab === 'all' && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 md:p-8 text-center shadow-sm hover:border-blue-300 transition-colors relative">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Upload className="w-5 h-5 stroke-[1.75]" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
            {currentFolder._id ? `Upload Files to "${currentFolder.name}"` : 'Upload Files to Storage'}
          </h2>

          <p className="text-xs text-slate-500 mb-4">
            {currentFolder._id
              ? `Files uploaded here will be stored inside directory "${currentFolder.name}"`
              : 'Select files to upload directly to your S3 storage vault'}
          </p>

          {uploading && (
            <div className="max-w-md mx-auto mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsCreatingFolder(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Directory</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDrivePicker}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 87.3 78">
                <path fill="#0066DA" d="M6.6 66.85l3.85 6.65c.8 1.4 1.9 2.5 3.3 3.3l13.75-23.8H0c0 1.6.4 3.2 1.2 4.6l5.4 9.25z"/>
                <path fill="#00AC47" d="M43.65 25L29.9 1.2C28.5.4 26.9 0 25.3 0h-7c-1.6 0-3.2.4-4.6 1.2L0 25h27.5l16.15 0z"/>
                <path fill="#EA4335" d="M73.55 76.8c1.4-.8 2.5-1.9 3.3-3.3l5.4-9.35c.8-1.4 1.2-3 1.2-4.6H55.95l17.6 30.55z"/>
                <path fill="#00832D" d="M27.5 25L13.75 1.2C12.35 2 11.25 3.1 10.45 4.5L1.2 20.45C.4 21.85 0 23.45 0 25.05h27.5z"/>
                <path fill="#2684FC" d="M55.95 25L42.2 1.2C40.8.4 39.2 0 37.6 0h-7.65L46.1 25h9.85z"/>
                <path fill="#FFBA00" d="M86.1 20.45L76.85 4.5c-.8-1.4-1.9-2.5-3.3-3.3L59.8 25h27.5c0-1.6-.4-3.2-1.2-4.55z"/>
              </svg>
              <span>Import from Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Create Directory */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Create Directory {currentFolder._id ? `in "${currentFolder.name}"` : ''}
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Rename {renameItem.isFolder ? 'Directory' : 'File'}
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal (Milestone 7) */}
      {shareItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 truncate max-w-xs" title={shareItem.name}>
                    Share "{shareItem.name}"
                  </h3>
                  <p className="text-xs text-slate-500">Configure public access link & protection</p>
                </div>
              </div>
              <button
                onClick={() => setShareItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveShareSettings} className="space-y-4">
              {/* Public Link Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">Public Link Enabled</span>
                </div>
                <input
                  type="checkbox"
                  checked={shareSettings.isPublic}
                  onChange={(e) =>
                    setShareSettings((prev) => ({ ...prev, isPublic: e.target.checked }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Share URL Box */}
              {shareUrl && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Public Share URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareUrl}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Password Protection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Access Password (Optional)
                </label>
                <input
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) =>
                    setShareSettings((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Set password to protect this file..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Expiration Hours */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Link Expiration
                </label>
                <select
                  value={shareSettings.expiresInHours}
                  onChange={(e) =>
                    setShareSettings((prev) => ({ ...prev, expiresInHours: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value={0}>Never Expire</option>
                  <option value={1}>Expires in 1 Hour</option>
                  <option value={24}>Expires in 24 Hours (1 Day)</option>
                  <option value={168}>Expires in 7 Days</option>
                </select>
              </div>

              {/* Allow Download Toggle */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-700">Allow Direct File Download</span>
                <input
                  type="checkbox"
                  checked={shareSettings.allowDownload}
                  onChange={(e) =>
                    setShareSettings((prev) => ({ ...prev, allowDownload: e.target.checked }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {shareItem.isPublic ? (
                  <button
                    type="button"
                    onClick={handleRevokeShare}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Revoke Link
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShareItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={sharingSaving}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                  >
                    {sharingSaving ? 'Saving...' : 'Save & Enable'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Permanently?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800">{deleteConfirmItem.name}</strong>? Storage quota will be updated.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal (Matching Reference Screenshot 1) */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-5 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Details</h3>
              <button
                onClick={() => setDetailsItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Icon & Name Header */}
            <div className="flex items-center space-x-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm shrink-0">
                {renderFileIcon(detailsItem.mimeType, detailsItem.isFolder)}
              </div>
              <div className="truncate">
                <h4 className="font-bold text-slate-900 text-sm truncate" title={detailsItem.name}>
                  {detailsItem.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium capitalize">
                  {detailsItem.isFolder
                    ? 'Folder'
                    : detailsItem.mimeType
                    ? detailsItem.mimeType.split('/')[1]?.toUpperCase() || 'File'
                    : 'File'}
                </p>
              </div>
            </div>

            {/* Details Key-Value Rows */}
            <div className="space-y-3.5 text-xs pt-1">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Size</span>
                <span className="font-bold text-slate-900">
                  {detailsItem.isFolder ? '0 Bytes' : detailsItem.formattedSize || `${(detailsItem.size / 1024).toFixed(2)} KB`}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Created</span>
                <span className="font-bold text-slate-900">{formatDateTime(detailsItem.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Modified</span>
                <span className="font-bold text-slate-900">{formatDateTime(detailsItem.updatedAt || detailsItem.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Path</span>
                <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded max-w-[220px] truncate" title={getFilePathString(detailsItem)}>
                  {getFilePathString(detailsItem)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Shared via link</span>
                <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${detailsItem.isPublic ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {detailsItem.isPublic ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search, Layout Switcher & Filters */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files & directories..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All File Types</option>
            <option value="folder">Folders / Directories</option>
            <option value="pdf">PDF Documents</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio Files</option>
            <option value="document">Text & Docs</option>
          </select>

          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Breadcrumbs Row (Only in My Storage) */}
      {activeTab === 'all' && (
        <div className="flex items-center justify-between px-1 pt-1 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-600 flex-wrap">
            {folderPath.map((folder, index) => (
              <div key={folder._id || 'root'} className="flex items-center space-x-1.5">
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  onClick={() => handleNavigateBreadcrumb(index)}
                  className={`hover:text-blue-600 transition-colors flex items-center gap-1.5 ${
                    index === folderPath.length - 1
                      ? 'font-bold text-slate-900 bg-white shadow-sm border border-slate-200/80 px-2.5 py-1 rounded-lg'
                      : 'text-slate-500 hover:bg-slate-200/60 px-2 py-1 rounded-lg'
                  }`}
                >
                  {index === 0 ? (
                    <>
                      <HomeIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>root-{usernameSlug}</span>
                    </>
                  ) : (
                    <>
                      <Folder className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{folder.name}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={loadDashboardData}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 shrink-0 ml-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      )}

      {/* Files Display Section */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Loading vault contents...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <Folder className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-700">
            {activeTab === 'starred'
              ? 'No starred files yet'
              : activeTab === 'trash'
              ? 'Trash bin is empty'
              : currentFolder._id
              ? `Directory "${currentFolder.name}" is empty`
              : 'No files or directories found'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'all' && 'Click "Upload File" or "Create Directory" above to add items.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file._id}
              onClick={() => file.isFolder && handleOpenFolder(file)}
              className={`bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group relative ${
                file.isFolder ? 'cursor-pointer' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                      {renderFileIcon(file.mimeType, file.isFolder)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 relative">
                    <button
                      onClick={(e) => handleToggleStar(e, file._id)}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                        file.isStarred ? 'text-amber-400' : 'text-slate-300'
                      }`}
                      title="Star item"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>

                    {/* Three Dots Context Menu Button (Matching Screenshot 2) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === file._id ? null : file._id);
                      }}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Context Dropdown Menu (Screenshot 2) */}
                    {activeMenuId === file._id && (
                      <div
                        className="absolute right-0 top-7 z-30 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setDetailsItem(file);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                        >
                          <Info className="w-4 h-4 text-slate-400" />
                          <span>Details</span>
                        </button>

                        {!file.isFolder && file.downloadUrl && (
                          <a
                            href={file.downloadUrl}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveMenuId(null)}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                          >
                            <Download className="w-4 h-4 text-slate-400" />
                            <span>Download</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenShareModal({ stopPropagation: () => {} }, file);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                        >
                          <Share2 className="w-4 h-4 text-slate-400" />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setRenameItem(file);
                            setRenameValue(file.name);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                          <span>Rename</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleTrashFile({ stopPropagation: () => {} }, file._id);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 border-t border-slate-100 mt-1"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm truncate mb-1" title={file.name}>
                  {file.name}
                </h3>
                <div className="flex items-center space-x-2 mb-1">
                  {getFileCategoryBadge(file.mimeType, file.isFolder)}
                  <span className="text-xs text-slate-500 font-medium">
                    {file.isFolder ? 'Folder' : file.formattedSize || '0 Bytes'}
                  </span>
                </div>
              </div>

              {/* Card Actions Footer (Matching Screenshot 1 & 2) */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailsItem(file);
                  }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-semibold transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>

                {activeTab === 'trash' ? (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleRestoreFile(e, file._id)}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                      title="Restore"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmItem(file);
                      }}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : !file.isFolder && file.downloadUrl ? (
                  <a
                    href={file.downloadUrl}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Layout View */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {files.map((file) => (
                <tr
                  key={file._id}
                  onClick={() => file.isFolder && handleOpenFolder(file)}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    file.isFolder ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="py-3 px-4 flex items-center space-x-3">
                    {renderFileIcon(file.mimeType, file.isFolder)}
                    <span className="font-bold text-slate-900 truncate max-w-xs">{file.name}</span>
                  </td>
                  <td className="py-3 px-4">{getFileCategoryBadge(file.mimeType, file.isFolder)}</td>
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {file.isFolder ? 'Folder' : file.formattedSize || '0 Bytes'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {activeTab === 'trash' ? (
                      <>
                        <button
                          onClick={(e) => handleRestoreFile(e, file._id)}
                          className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmItem(file);
                          }}
                          className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsItem(file);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          title="Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenShareModal(e, file)}
                          className={`p-1.5 rounded ${
                            file.isPublic ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {!file.isFolder && file.downloadUrl && (
                          <a
                            href={file.downloadUrl}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 inline-block"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameItem(file);
                            setRenameValue(file.name);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:bg-slate-100"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleTrashFile(e, file._id)}
                          className="p-1.5 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* 1. Google Drive Picker Modal */}
      {isDrivePickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-slate-800">Select a file</h3>
              <button
                onClick={() => setIsDrivePickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header / Navigation Tabs */}
            <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex items-center">
              <div className="py-3 text-xs font-bold text-blue-600 border-b-2 border-blue-600 tracking-wide flex items-center space-x-2">
                <span>Google Drive</span>
              </div>
            </div>

            {/* Toolbar Controls (Search, Sort, View mode) */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={driveSearchQuery}
                    onChange={(e) => setDriveSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setDriveViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        driveViewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDriveViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        driveViewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Files Grid / List */}
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-3">Files</span>

                {isFetchingDriveFiles ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Fetching Google Drive files...</p>
                  </div>
                ) : (
                  <div
                    className={
                      driveViewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'
                        : 'space-y-2'
                    }
                  >
                    {driveFilesList
                      .filter((f) => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase()))
                      .map((file) => {
                        const isSelected = selectedDriveFiles.some((item) => item.id === file.id);
                        const isPdf = file.mimeType === 'application/pdf' || file.name.endsWith('.pdf');
                        const isDoc = file.mimeType.includes('document') || file.name.includes('Roadmap');

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleToggleDriveFileSelect(file)}
                            className={`cursor-pointer rounded-2xl border transition-all p-3 bg-white relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                                : 'border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            {/* Thumbnail Preview Area */}
                            <div className="w-full h-28 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-2 relative flex items-center justify-center">
                              {file.thumbnailLink ? (
                                <img
                                  src={file.thumbnailLink}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-slate-400">
                                  {renderFileIcon(file.mimeType, false)}
                                </div>
                              )}

                              {/* Category Badge Icon */}
                              <div className="absolute left-2 bottom-2">
                                {isPdf ? (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-rose-600 text-white shadow-sm">
                                    PDF
                                  </span>
                                ) : isDoc ? (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-blue-600 text-white shadow-sm">
                                    DOC
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-emerald-600 text-white shadow-sm">
                                    IMG
                                  </span>
                                )}
                              </div>

                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-start space-x-3">
              <button
                onClick={handleConfirmDriveImport}
                disabled={selectedDriveFiles.length === 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                Select ({selectedDriveFiles.length})
              </button>
              <button
                onClick={() => setIsDrivePickerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Upload Progress Card */}
      {isDriveImporting && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 w-80 space-y-3.5 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0"></div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Uploading Files</h4>
                <p className="text-[11px] text-slate-400 font-medium">Please don't close this window</p>
              </div>
            </div>
            <span className="text-sm font-black text-slate-900">{driveImportProgress}%</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">
                {driveCurrentFileIndex} of {driveTotalFilesCount} files
              </span>
              <span className="font-bold text-blue-600">In Progress</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${driveImportProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Upload in progress, please wait...</span>
          </div>
        </div>
      )}

      {/* 3. Google Drive Success Modal */}
      {showDriveSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-5 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowDriveSuccessModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Success</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Files have been uploaded successfully. You can find them in the 'Google Drive' folder at the root directory.
              </p>
            </div>

            <button
              onClick={() => setShowDriveSuccessModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
