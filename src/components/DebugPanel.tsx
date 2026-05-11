import React from 'react';
import { Photo } from '../providers/types';

interface DebugPanelProps {
  queue: Photo[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({ queue }) => (
  <div className="absolute bottom-20 right-4 bg-black bg-opacity-60 backdrop-blur-lg rounded-lg p-3 text-white text-xs">
    <div className="text-center mb-2 font-semibold">
      Preload queue ({queue.length}/2)
    </div>
    <div className="flex flex-col space-y-2">
      {queue.map((photo, index) => (
        <div key={photo.url} className="flex items-center space-x-2">
          <div className="w-10 h-7 bg-gray-300 rounded overflow-hidden">
            <img
              src={photo.url}
              alt={`Preloaded ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-xs">
            <div>Next {index + 1}</div>
            <div className="text-gray-300">{photo.photographerName}</div>
          </div>
        </div>
      ))}
      {queue.length === 0 && (
        <div className="text-gray-400 text-center">Queue empty</div>
      )}
    </div>
  </div>
);

export default DebugPanel;
