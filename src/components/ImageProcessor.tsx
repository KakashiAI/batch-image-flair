import React, { useState } from 'react';
import { Download, FileArchive, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import JSZip from 'jszip';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface CSVMapping {
  currentName: string;
  newName: string;
}

interface ProcessedImage {
  originalFile: ImageFile;
  newName: string;
  status: 'pending' | 'processed' | 'failed';
  blob?: Blob;
  error?: string;
}

interface ImageProcessorProps {
  images: ImageFile[];
  mapping: CSVMapping[];
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ images, mapping }) => {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImages = async () => {
    if (images.length === 0 || mapping.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const processed: ProcessedImage[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const originalFileName = image.file.name;
      const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      
      // Find mapping for this image
      const mappingEntry = mapping.find(m => 
        m.currentName === originalFileName || 
        m.currentName === fileNameWithoutExt ||
        originalFileName.includes(m.currentName) ||
        fileNameWithoutExt.includes(m.currentName)
      );

      const processedImage: ProcessedImage = {
        originalFile: image,
        newName: mappingEntry ? mappingEntry.newName : originalFileName,
        status: 'pending'
      };

      try {
        // Create a new blob with the same image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = image.preview;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // Get file extension from original or default to jpg
        const originalExt = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
        let newFileName = processedImage.newName;
        
        // Add extension if not present
        if (!newFileName.includes('.')) {
          newFileName += `.${originalExt}`;
        }

        processedImage.newName = newFileName;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
            `image/${originalExt === 'jpg' ? 'jpeg' : originalExt}`,
            0.9
          );
        });

        processedImage.blob = blob;
        processedImage.status = 'processed';
      } catch (error) {
        processedImage.status = 'failed';
        processedImage.error = error instanceof Error ? error.message : 'Processing failed';
      }

      processed.push(processedImage);
      setProgress(((i + 1) / images.length) * 100);
      setProcessedImages([...processed]);

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessing(false);
  };

  const downloadSingle = (processedImage: ProcessedImage) => {
    if (!processedImage.blob) return;

    const url = URL.createObjectURL(processedImage.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = processedImage.newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const successfulImages = processedImages.filter(img => img.status === 'processed' && img.blob);

    for (const processedImage of successfulImages) {
      if (processedImage.blob) {
        zip.file(processedImage.newName, processedImage.blob);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'renamed-images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canProcess = images.length > 0 && mapping.length > 0;
  const hasProcessedImages = processedImages.length > 0;
  const successfulImages = processedImages.filter(img => img.status === 'processed');

  return (
    <div className="space-y-4">
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Process Images</h3>
          {canProcess && (
            <Button 
              onClick={processImages} 
              disabled={isProcessing}
              className="bg-gradient-primary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Start Processing'
              )}
            </Button>
          )}
        </div>

        {!canProcess && (
          <p className="text-muted-foreground text-center py-8">
            Upload images and CSV mapping to start processing
          </p>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing images... {Math.round(progress)}%
            </p>
          </div>
        )}
      </Card>

      {hasProcessedImages && (
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Results ({successfulImages.length} processed)
            </h3>
            {successfulImages.length > 0 && (
              <Button 
                onClick={downloadAll}
                variant="secondary"
                className="bg-gradient-secondary"
              >
                <FileArchive className="h-4 w-4 mr-2" />
                Download All as ZIP
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {processedImages.map((processedImage, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-background">
                    <img
                      src={processedImage.originalFile.preview}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {processedImage.originalFile.file.name} → {processedImage.newName}
                    </p>
                    {processedImage.error && (
                      <p className="text-xs text-destructive">{processedImage.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {processedImage.status === 'processed' && (
                      <CheckCircle className="h-5 w-5 text-secondary" />
                    )}
                    {processedImage.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    {processedImage.status === 'pending' && (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {processedImage.status === 'processed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadSingle(processedImage)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};