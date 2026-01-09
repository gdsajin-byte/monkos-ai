import React, { useState } from 'react';

interface BatchDisplayProps {
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    aspectRatio?: string;
    timestamp: number;
    metadata?: any;
  }>;
  currentBatch: string[];
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
}

const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const BatchDisplay: React.FC<BatchDisplayProps> = ({
  images = [],
  currentBatch = [],
  onDelete,
  onExpand,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/40">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-lg">No images generated yet</p>
          <p className="text-sm mt-2">Click "Generate Images" to start</p>
        </div>
      </div>
    );
  }

  // Expanded image modal
  if (expandedImage) {
    const img = images.find(i => i.id === expandedImage);
    if (img) {
      return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8">
          {/* Action buttons - top right */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => downloadImage(img.url, `imagen-${img.id}-${Date.now()}.png`)}
              className="w-10 h-10 bg-black/60 hover:bg-green-600 rounded backdrop-blur-sm transition-all"
              title="Download"
            >
              <i className="fa-solid fa-download text-white text-sm"></i>
            </button>
            <button
              onClick={() => {
                onDelete(img.id);
                setExpandedImage(null);
              }}
              className="w-10 h-10 bg-black/60 hover:bg-red-600 rounded backdrop-blur-sm transition-all"
              title="Delete"
            >
              <i className="fa-solid fa-trash text-white text-sm"></i>
            </button>
            <button
              onClick={() => setExpandedImage(null)}
              className="w-10 h-10 bg-black/60 hover:bg-white/20 rounded backdrop-blur-sm transition-all"
              title="Back to batch"
            >
              <i className="fa-solid fa-xmark text-white text-lg"></i>
            </button>
          </div>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={img.url}
              alt={img.id}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            {img.metadata && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm rounded-b-xl p-4">
                <p className="text-white text-sm">{img.metadata.prompt}</p>
                {img.metadata.negativePrompt && (
                  <p className="text-red-400 text-xs mt-2">Negative: {img.metadata.negativePrompt}</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="h-full flex items-start justify-start p-2 overflow-hidden">
      <div className="grid grid-cols-2 gap-2 w-[70%] h-[70%]" style={{ gridAutoRows: '1fr' }}>
        {images.map((img) => (
          <div 
            key={img.id} 
            className="relative group overflow-hidden rounded-lg border border-white/10 bg-black/20 cursor-pointer"
            onClick={() => setExpandedImage(img.id)}
          >
            <img
              src={img.url}
              alt={img.id}
              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
            />
            
            {/* Action Buttons */}
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(img.url, `imagen-${img.id}-${Date.now()}.png`);
                }}
                className="w-6 h-6 bg-black/60 hover:bg-green-600 rounded backdrop-blur-sm transition-all"
                title="Download"
              >
                <i className="fa-solid fa-download text-white text-[10px]"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(img.id);
                }}
                className="w-6 h-6 bg-black/60 hover:bg-red-600 rounded backdrop-blur-sm transition-all"
                title="Delete"
              >
                <i className="fa-solid fa-trash text-white text-[10px]"></i>
              </button>
            </div>

            {/* Metadata */}
            {img.metadata && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-white/90 text-[10px] truncate">
                  {img.metadata.prompt}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
