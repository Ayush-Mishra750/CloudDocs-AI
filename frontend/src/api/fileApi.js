import api from './axiosInstance';

/**
 * Fetch list of user files and storage usage statistics
 */
export const getFiles = async (params = {}) => {
  const response = await api.get('/files', { params });
  return response.data;
};

/**
 * Direct file upload with progress tracking
 */
export const uploadFile = async (file, onUploadProgress, parentFolder = null) => {
  const formData = new FormData();
  if (parentFolder) {
    formData.append('parentFolder', parentFolder);
  }
  formData.append('file', file);

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

/**
 * Get S3 Presigned Upload URL
 */
export const getUploadPresignedUrl = async ({ name, mimeType, size, parentFolder }) => {
  const response = await api.post('/files/upload-url', {
    name,
    mimeType,
    size,
    parentFolder,
  });
  return response.data;
};

/**
 * Confirm direct browser-to-S3 upload metadata in DB
 */
export const confirmPresignedUpload = async (fileData) => {
  const response = await api.post('/files/confirm-upload', fileData);
  return response.data;
};

/**
 * Create a new folder/directory
 */
export const createFolder = async ({ name, parentFolder }) => {
  const response = await api.post('/files/folder', { name, parentFolder });
  return response.data;
};

/**
 * Delete a file by ID
 */
export const deleteFile = async (id) => {
  const response = await api.delete(`/files/${id}`);
  return response.data;
};

/**
 * Rename file or folder by ID
 */
export const renameFileApi = async (id, name) => {
  const response = await api.patch(`/files/${id}/rename`, { name });
  return response.data;
};

/**
 * Toggle favorite/star status
 */
export const toggleStarFileApi = async (id) => {
  const response = await api.patch(`/files/${id}/star`);
  return response.data;
};

/**
 * Move file or folder to trash
 */
export const trashFileApi = async (id) => {
  const response = await api.patch(`/files/${id}/trash`);
  return response.data;
};

/**
 * Restore file or folder from trash
 */
export const restoreFileApi = async (id) => {
  const response = await api.patch(`/files/${id}/restore`);
  return response.data;
};

/**
 * Generate/update share link settings
 */
export const createShareLinkApi = async (id, shareSettings) => {
  const response = await api.post(`/files/${id}/share`, shareSettings);
  return response.data;
};

/**
 * Revoke public share link
 */
export const revokeShareLinkApi = async (id) => {
  const response = await api.delete(`/files/${id}/share`);
  return response.data;
};

/**
 * Get shared file details by shareToken (Public)
 */
export const getSharedFileApi = async (shareToken, password = '') => {
  const response = await api.get(`/files/share/${shareToken}`, {
    params: password ? { password } : {},
  });
  return response.data;
};

/**
 * Import files from Google Drive
 */
export const importGoogleDriveFilesApi = async ({ files, accessToken }) => {
  const response = await api.post('/files/import-google-drive', { files, accessToken });
  return response.data;
};
