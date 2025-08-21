import React, { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { CSVUpload } from '@/components/CSVUpload';
import { ImageProcessor } from '@/components/ImageProcessor';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, FileImage } from 'lucide-react';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface CSVMapping {
  currentName: string;
  newName: string;
}

const Index = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [mapping, setMapping] = useState<CSVMapping[]>([]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileImage className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Image Renaming Tool
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your images and CSV mapping file to batch rename images quickly and efficiently. 
            Perfect for organizing photo collections, product catalogs, and more.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Image Upload Section */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Step 1: Upload Images</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Select or drag & drop the images you want to rename
            </p>
            <ImageUpload images={images} onImagesChange={setImages} />
          </Card>

          {/* CSV Upload Section */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-semibold text-foreground">Step 2: Upload CSV Mapping</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Upload a CSV file with current and new image names
            </p>
            <CSVUpload mapping={mapping} onMappingChange={setMapping} />
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Processing Section */}
        <Card className="shadow-card">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">Step 3: Process & Download</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Process your images and download them with new names
            </p>
            <ImageProcessor images={images} mapping={mapping} />
          </div>
        </Card>

        {/* CSV Format Help */}
        <Card className="mt-8 p-6 bg-muted/50 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-3">CSV Format Guidelines</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Your CSV file should have two columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Current Name:</strong> The current filename (with or without extension)</li>
              <li><strong>New Name:</strong> The desired new filename</li>
            </ul>
            <p className="mt-3">
              <strong>Example CSV content:</strong>
            </p>
            <div className="bg-background p-3 rounded border font-mono text-xs mt-2">
              current_name,new_name<br />
              IMG_001.jpg,sunset_beach.jpg<br />
              IMG_002.jpg,mountain_view.jpg<br />
              old_photo.png,family_portrait.png
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;