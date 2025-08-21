import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  onImagesChange: (images: ImageFile[]) => void;
  images: ImageFile[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, images }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  };

  const clearAllImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    onImagesChange([]);
  };

  const downloadCSVTemplate = () => {
    const csvContent = [
      'current_name,new_name',
      ...images.map(img => `${img.file.name},`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'image_renaming_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-primary bg-gradient-upload scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-gradient-upload'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-primary font-medium">Drop the images here...</p>
        ) : (
          <div>
            <p className="text-foreground font-medium mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-muted-foreground text-sm">
              Supports: PNG, JPG, JPEG, GIF, BMP, WebP
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Uploaded Images ({images.length})
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={downloadCSVTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllImages}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {image.file.name}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};