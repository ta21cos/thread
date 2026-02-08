import React from 'react';

interface ImagePreviewProps {
  images: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images, isExpanded, onToggle }) => {
  if (images.length === 0) return null;

  if (isExpanded) {
    return (
      <div className="space-y-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Image ${i + 1}`}
            className="w-full rounded-lg border border-border"
          />
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-primary text-xs hover:underline"
        >
          Collapse images
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center gap-2"
    >
      <div className="flex -space-x-2">
        {images.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Thumbnail ${i + 1}`}
            className="h-12 w-12 rounded border-2 border-background object-cover"
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs">
        {images.length} {images.length === 1 ? 'image' : 'images'} - Click to expand
      </span>
    </button>
  );
};

export default ImagePreview;
