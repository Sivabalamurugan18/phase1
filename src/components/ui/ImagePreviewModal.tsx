import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ZoomIn, ZoomOut, RotateCw, Download, X, Maximize2, Minimize2 } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  onDownload?: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size={isFullscreen ? "xl" : "lg"}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">
              Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}°
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ZoomOut className="h-4 w-4" />}
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              title="Zoom Out"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ZoomIn className="h-4 w-4" />}
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              title="Zoom In"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCw className="h-4 w-4" />}
              onClick={handleRotate}
              title="Rotate 90°"
            />
            <Button
              variant="outline"
              size="sm"
              icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Reset View"
            >
              Reset
            </Button>
            {onDownload && (
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={onDownload}
                title="Download"
              >
                Download
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
              title="Close"
            />
          </div>
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className={`relative overflow-hidden bg-gray-100 rounded-lg ${
            isFullscreen ? 'h-[80vh]' : 'h-[60vh]'
          } flex items-center justify-center cursor-${zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={fileName}
            className="max-w-none transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center'
            }}
            draggable={false}
            onLoad={() => {
              // Auto-fit image to container on load
              if (imageRef.current && containerRef.current) {
                const img = imageRef.current;
                const container = containerRef.current;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const containerAspect = container.clientWidth / container.clientHeight;
                
                if (imgAspect > containerAspect) {
                  // Image is wider than container
                  const fitZoom = container.clientWidth / img.naturalWidth;
                  setZoom(Math.min(fitZoom * 0.9, 1));
                } else {
                  // Image is taller than container
                  const fitZoom = container.clientHeight / img.naturalHeight;
                  setZoom(Math.min(fitZoom * 0.9, 1));
                }
              }
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500">
          <p>Use mouse wheel to zoom • Click and drag to pan when zoomed • Use controls above for precise adjustments</p>
        </div>
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;