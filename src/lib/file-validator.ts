/**
 * File Upload Validator
 * Validates MIME type and file size before uploading to Supabase Storage.
 */

export interface FileValidation {
  isValid: boolean;
  error: string | null;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validates a file before upload.
 * Checks: MIME type, file extension, and file size.
 */
export function validateUploadFile(file: File): FileValidation {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File is too large (${sizeMB}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  // 2. Check file size is not zero (empty file)
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty. Please select a valid file.',
    };
  }

  // 3. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type || 'unknown'}" is not accepted. Allowed: JPG, PNG, WebP, PDF.`,
    };
  }

  // 4. Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ".${extension}" is not accepted. Allowed: .jpg, .png, .webp, .pdf.`,
    };
  }

  return { isValid: true, error: null };
}
