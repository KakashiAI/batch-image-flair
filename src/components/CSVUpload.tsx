import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVMapping {
  currentName: string;
  newName: string;
}

interface CSVUploadProps {
  onMappingChange: (mapping: CSVMapping[]) => void;
  mapping: CSVMapping[];
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ onMappingChange, mapping }) => {
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const parseCSV = (text: string): CSVMapping[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find columns for current and new names (flexible column detection)
    const currentNameIndex = headers.findIndex(h => 
      h.includes('current') || h.includes('old') || h.includes('original') || h === 'from'
    );
    const newNameIndex = headers.findIndex(h => 
      h.includes('new') || h.includes('rename') || h.includes('target') || h === 'to'
    );

    if (currentNameIndex === -1 || newNameIndex === -1) {
      // Fallback: use first two columns
      if (headers.length < 2) {
        throw new Error('CSV must have at least 2 columns');
      }
      console.warn('Using first two columns as current and new names');
    }

    const useCurrentIndex = currentNameIndex !== -1 ? currentNameIndex : 0;
    const useNewIndex = newNameIndex !== -1 ? newNameIndex : 1;

    const mappings: CSVMapping[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim());
      if (columns.length >= 2) {
        const currentName = columns[useCurrentIndex]?.replace(/['"]/g, '') || '';
        const newName = columns[useNewIndex]?.replace(/['"]/g, '') || '';
        
        if (currentName && newName) {
          mappings.push({ currentName, newName });
        }
      }
    }

    return mappings;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setCsvFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const mappings = parseCSV(text);
        onMappingChange(mappings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  }, [onMappingChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  const clearMapping = () => {
    setCsvFile(null);
    onMappingChange([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-secondary bg-gradient-upload scale-[1.02]' 
            : 'border-border hover:border-secondary/50 hover:bg-gradient-upload'
          }
        `}
      >
        <input {...getInputProps()} />
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-secondary font-medium">Drop the CSV file here...</p>
        ) : (
          <div>
            <p className="text-foreground font-medium mb-2">
              Drag & drop your CSV file here, or click to select
            </p>
            <p className="text-muted-foreground text-sm">
              CSV should have columns for current and new image names
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {csvFile && mapping.length > 0 && (
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Mapping ({mapping.length} entries)
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearMapping}
              className="text-destructive hover:text-destructive"
            >
              Clear
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="font-medium text-muted-foreground">Current Name</div>
              <div className="font-medium text-muted-foreground">New Name</div>
              
              {mapping.slice(0, 10).map((item, index) => (
                <React.Fragment key={index}>
                  <div className="text-foreground truncate">{item.currentName}</div>
                  <div className="text-foreground truncate">{item.newName}</div>
                </React.Fragment>
              ))}
              
              {mapping.length > 10 && (
                <div className="col-span-2 text-center text-muted-foreground py-2">
                  ... and {mapping.length - 10} more entries
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};