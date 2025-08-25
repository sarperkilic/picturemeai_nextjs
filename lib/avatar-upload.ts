import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { auth } from './firebase';

export interface UploadAvatarData {
  file: File;
  avatarName: string;
  gender: 'male' | 'female' | 'neutral';
  category: string;
}

export interface UploadAvatarResult {
  id: string;
  storage_url: string;
  avatar_name: string;
}

/**
 * Upload avatar using multipart form data (recommended method)
 */
export async function uploadAvatarWithFormData(data: UploadAvatarData): Promise<UploadAvatarResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to upload avatars');
  }

  const idToken = await user.getIdToken();
  
  // Create form data
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('avatar_name', data.avatarName);
  formData.append('gender', data.gender);
  formData.append('category', data.category);

  const response = await fetch('/api/templates/avatars/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload avatar');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload avatar to Firebase Storage (legacy method)
 */
export async function uploadAvatarToStorage(data: UploadAvatarData): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to upload avatars');
  }

  const { file, avatarName, gender } = data;
  
  // Create unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${avatarName}_${gender}_${user.uid}_${timestamp}.${fileExtension}`;
  
  // Upload to Firebase Storage
  const storageRef = ref(storage, `avatars/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

/**
 * Create avatar template via API (legacy method)
 */
export async function createAvatarTemplate(data: {
  avatarName: string;
  storageUrl: string;
  gender: 'male' | 'female' | 'neutral';
  category: string;
  fileName: string;
  fileSize: number;
}): Promise<UploadAvatarResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to create avatar templates');
  }

  const idToken = await user.getIdToken();
  
  const response = await fetch('/api/templates/avatars/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatar_name: data.avatarName,
      storage_url: data.storageUrl,
      gender: data.gender,
      category: data.category,
      file_name: data.fileName,
      file_size: data.fileSize,
      upload_source: 'user',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create avatar template');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload avatar (legacy method - combines storage upload and template creation)
 */
export async function uploadAvatar(data: UploadAvatarData): Promise<UploadAvatarResult> {
  // First upload to storage
  const storageUrl = await uploadAvatarToStorage(data);
  
  // Then create template record
  const template = await createAvatarTemplate({
    avatarName: data.avatarName,
    storageUrl,
    gender: data.gender,
    category: data.category,
    fileName: data.file.name,
    fileSize: data.file.size,
  });
  
  return template;
}

/**
 * Validate avatar file before upload
 */
export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 5MB.',
    };
  }

  return { isValid: true };
} 