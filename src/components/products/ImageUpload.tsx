import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { Upload, Link, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

type Mode = 'url' | 'upload';

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [mode, setMode] = useState<Mode>(value ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(value);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, progress } = useImageUpload();
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    const result = await uploadImage(file);

    if (result.error) {
      toast({
        title: 'Erreur',
        description: result.error,
        variant: 'destructive'
      });
      return;
    }

    if (result.url) {
      onChange(result.url);
      setUrlInput(result.url);
      toast({
        title: 'Image uploadee',
        description: 'L\'image a ete uploadee avec succes.'
      });
    }
  }, [uploadImage, onChange, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    onChange(newUrl);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Image du produit</Label>
        <div className="flex gap-1 p-0.5 bg-muted rounded-md">
          <Button
            type="button"
            variant={mode === 'upload' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setMode('upload')}
          >
            <Upload className="h-3 w-3" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button
            type="button"
            variant={mode === 'url' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setMode('url')}
          >
            <Link className="h-3 w-3" />
            URL
          </Button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            uploading && 'pointer-events-none opacity-60'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {value ? (
            <div className="relative aspect-video">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 flex flex-col items-center justify-center gap-2 text-center"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Upload en cours... {progress}%
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Cliquez ou glissez une image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP ou GIF (max 5 Mo)
                    </p>
                  </div>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={handleUrlChange}
              className="h-12 text-base"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {value && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
