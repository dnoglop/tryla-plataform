
import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploaderProps {
  onImageUpload: (url: string) => void;
  onRemoveImage?: (url: string) => void;
  existingImages?: string[];
  maxImages?: number;
}

const ImageUploader = ({
  onImageUpload,
  onRemoveImage,
  existingImages = [],
  maxImages = 5
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    setUploading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }
      
      // Upload the image to the Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL of the image
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      if (data && data.publicUrl) {
        onImageUpload(data.publicUrl);
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError(`Falha ao fazer upload da imagem: ${error.message || 'Tente novamente.'}`);
    } finally {
      setUploading(false);
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  const handleRemoveImage = (url: string) => {
    if (onRemoveImage) {
      onRemoveImage(url);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {existingImages.map((url, index) => (
          <div key={index} className="relative group">
            <img 
              src={url} 
              alt={`Imagem ${index + 1}`} 
              className="h-24 w-24 object-cover rounded-md border border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(url)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {existingImages.length < maxImages && (
          <label className="h-24 w-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              className="sr-only" 
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <div className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-gray-400" />
                <span className="mt-1 text-xs text-gray-500">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUploader;
