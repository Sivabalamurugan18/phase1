import React from 'react';
import { Construction } from 'lucide-react';

interface UnderDevelopmentOverlayProps {
  isVisible: boolean;
}

const UnderDevelopmentOverlay: React.FC<UnderDevelopmentOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      {/* Dark overlay background - only covers the content area */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Watermark content */}
      <div className="relative z-10 text-center">
        <Construction className="mx-auto h-24 w-24 text-white opacity-30 mb-6" />
        <h1 className="text-6xl font-bold text-white opacity-20 tracking-wider">
          UNDER DEVELOPMENT
        </h1>
        <p className="text-xl text-white opacity-15 mt-4 font-medium">
          This feature is coming soon
        </p>
      </div>
    </div>
  );
};

export default UnderDevelopmentOverlay;