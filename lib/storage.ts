import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: Date;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  file: File | Buffer,
  path: string,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<UploadResult> {
  try {
    const storageRef = ref(storage, path);
    
    // If it's a Buffer, convert to Uint8Array
    const uploadData = file instanceof Buffer ? new Uint8Array(file) : file;
    
    const snapshot = await uploadBytes(storageRef, uploadData, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      size: snapshot.metadata.size || 0,
      type: snapshot.metadata.contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get download URL for a file
 */
export async function getFileURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List all files in a directory
 */
export async function listFiles(directory: string): Promise<StorageFile[]> {
  try {
    const storageRef = ref(storage, directory);
    const result = await listAll(storageRef);
    
    const files: StorageFile[] = [];
    
    for (const item of result.items) {
      try {
        const url = await getDownloadURL(item);
        files.push({
          name: item.name,
          url,
          size: 0, // Size not available from listAll
          type: 'application/octet-stream', // Type not available from listAll
          createdAt: new Date(), // Creation time not available from listAll
        });
      } catch (error) {
        console.warn(`Failed to get URL for ${item.name}:`, error);
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload avatar image to Firebase Storage
 */
export async function uploadAvatar(
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  const path = `avatars/${filename}`;
  const metadata = {
    contentType: 'image/png',
    customMetadata: {
      category: 'avatar',
      uploadedAt: new Date().toISOString(),
    },
  };
  
  return uploadFile(file, path, metadata);
}

/**
 * Get avatar URL by filename
 */
export async function getAvatarURL(filename: string): Promise<string> {
  const path = `avatars/${filename}`;
  return getFileURL(path);
}

/**
 * Delete avatar by filename
 */
export async function deleteAvatar(filename: string): Promise<void> {
  const path = `avatars/${filename}`;
  return deleteFile(path);
}

/**
 * List all avatar files
 */
export async function listAvatars(): Promise<StorageFile[]> {
  return listFiles('avatars');
} 