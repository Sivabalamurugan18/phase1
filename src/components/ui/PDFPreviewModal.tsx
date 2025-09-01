import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ZoomIn, ZoomOut, Download, X, Maximize2, Minimize2, FileText } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  onDownload?: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Create PDF viewer URL with zoom parameter
  const pdfViewerUrl = `${pdfUrl}#zoom=${Math.round(zoom * 100)}`;

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
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate max-w-md">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500">
                Zoom: {Math.round(zoom * 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ZoomOut className="h-4 w-4" />}
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom Out"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ZoomIn className="h-4 w-4" />}
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title="Zoom In"
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
              title="Reset Zoom"
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

        {/* PDF Container */}
        <div className={`relative bg-gray-100 rounded-lg ${isFullscreen ? 'h-[80vh]' : 'h-[60vh]'}`}>
          <iframe
            ref={iframeRef}
            src={pdfViewerUrl}
            className="w-full h-full rounded-lg border-0"
            title={fileName}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500">
          <p>Use zoom controls above • PDF viewer has built-in navigation and search features</p>
        </div>

        {/* Fallback for browsers that don't support PDF viewing */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Can't view the PDF? 
          </p>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={onDownload}
          >
            Download PDF to view locally
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PDFPreviewModal;