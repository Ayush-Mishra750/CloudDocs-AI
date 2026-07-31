import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'File MIME type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [0, 'File size cannot be negative'],
    },
    s3Key: {
      type: String,
      required: [true, 'S3 key is required'],
      unique: true,
      index: true,
    },
    s3Url: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
      index: true,
    },
    isFolder: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isTrash: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    aiSummary: {
      type: String,
      default: '',
    },
    aiStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed', 'unsupported'],
      default: 'pending',
      index: true,
    },
    embeddingCount: {
      type: Number,
      default: 0,
    },
    aiProcessedAt: {
      type: Date,
      default: null,
    },
    extractedText: {
      type: String,
      default: '',
    },
    // For File-Sharing Link
    sharedViaLink: {
      token: {
        type: String,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
      permission: {
        type: String,
        enum: ['viewer', 'editor'],
        default: 'viewer',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicPermission: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    sharePassword: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    allowDownload: {
      type: Boolean,
      default: true,
    },
    shareViews: {
      type: Number,
      default: 0,
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer',
        },
        role: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helper method to categorize file type
fileSchema.virtual('category').get(function () {
  if (this.isFolder) return 'folder';
  if (!this.mimeType) return 'other';
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType === 'application/pdf') return 'pdf';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (
    this.mimeType.includes('word') ||
    this.mimeType.includes('document') ||
    this.mimeType.includes('spreadsheet') ||
    this.mimeType.includes('presentation') ||
    this.mimeType.includes('text/')
  )
    return 'document';
  return 'other';
});

fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

const File = mongoose.model('File', fileSchema);

export default File;
