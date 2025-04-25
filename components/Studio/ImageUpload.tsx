"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Image as ImageIcon, Upload } from "lucide-react"

interface ImageUploadProps {
  onUpload: (file: File, previewUrl: string) => void;
  currentPreview?: string | null;
}

export function ImageUpload({ onUpload, currentPreview }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPreview || null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Update preview when currentPreview prop changes
  useEffect(() => {
    if (currentPreview !== undefined) {
      setPreview(currentPreview);
    }
  }, [currentPreview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Revoke previous preview URL if it exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      // Create new preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(file, previewUrl);
    }
  }, [onUpload, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="space-y-2">
          <img
            src={preview}
            alt="Preview"
            className="mx-auto max-h-48 rounded-lg object-cover"
          />
          <p className="text-sm text-muted-foreground">
            Drag and drop or click to replace
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Drag and drop your image here</p>
            <p className="text-xs text-muted-foreground">
              or click to browse files
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 