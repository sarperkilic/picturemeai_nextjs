'use client';

import { useState, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import Image from 'next/image';
import { UploadIcon } from '@/components/icons';
import { uploadAvatar } from '@/lib/avatar-upload';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (imageUrl: string, avatarName: string) => void;
}

const CATEGORIES = [
  'Car Talk',
  'Podcast',
  'Indoor',
  'Outdoor',
  'Business',
  'Casual',
  'Professional',
  'Creative',
];

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Neutral', value: 'neutral' },
];

export function AvatarUploadModal({ isOpen, onClose, onSuccess }: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [avatarName, setAvatarName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a synthetic event-like object
      const syntheticEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile || !avatarName || !gender || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Upload to Firebase Storage and create template
      const result = await uploadAvatar({
        file: selectedFile,
        avatarName,
        gender: gender as 'male' | 'female' | 'neutral',
        category,
      });
      
      onSuccess(result.storage_url, result.avatar_name);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setAvatarName('');
      setGender('');
      setCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedFile(null);
    setPreviewUrl('');
    setAvatarName('');
    setGender('');
    setCategory('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <ModalHeader>Upload Avatar Image</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-primary bg-primary/5'
                    : 'border-default-300 hover:border-primary hover:bg-primary/5'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UploadIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-default-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden">
                      <Image
                        alt="Preview"
                        className="w-full h-full object-cover"
                        height={96}
                        src={previewUrl}
                        width={96}
                      />
                    </div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-default-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Avatar Name"
                placeholder="Enter avatar name"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                isRequired
              />
              
              <Select
                label="Gender"
                placeholder="Select gender"
                selectedKeys={gender ? [gender] : []}
                onSelectionChange={(keys) => setGender(Array.from(keys)[0] as string)}
                isRequired
              >
                {GENDERS.map((genderOption) => (
                  <SelectItem key={genderOption.value}>
                    {genderOption.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Select
              label="Category"
              placeholder="Select category"
              selectedKeys={category ? [category] : []}
              onSelectionChange={(keys) => setCategory(Array.from(keys)[0] as string)}
              isRequired
            >
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat}>
                  {cat}
                </SelectItem>
              ))}
            </Select>

            {error && (
              <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleUpload}
            isLoading={isUploading}
            isDisabled={!selectedFile || !avatarName || !gender || !category}
          >
            Upload Avatar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 