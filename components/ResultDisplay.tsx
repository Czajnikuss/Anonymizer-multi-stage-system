import React from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import LoadingSpinner from './LoadingSpinner';

interface ResultDisplayProps {
  anonymizedText: string;
  anonymizationId: string;
  isLoading: boolean;
  onCopy: (text: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ anonymizedText, anonymizationId, isLoading, onCopy }) => {
  const hasResult = anonymizedText || anonymizationId;

  return (
    <div className="flex-grow flex flex-col p-4 bg-gray-800 border-2 border-gray-700 rounded-lg relative min-h-[20rem] lg:min-h-0">
      {isLoading && (
         <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center rounded-lg z-10">
            <LoadingSpinner />
            <p className="text-teal-300 mt-4 animate-pulse">Processing text...</p>
         </div>
      )}

      {!hasResult && !isLoading && (
        <div className="m-auto text-center text-gray-500">
          <p>Your anonymized text will appear here.</p>
        </div>
      )}

      {hasResult && (
        <>
          <div className="flex-grow relative">
            <textarea
              readOnly
              value={anonymizedText}
              className="w-full h-full p-2 bg-transparent border-0 rounded-md text-gray-200 resize-none focus:ring-0"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400">Anonymization ID</h4>
            <div className="flex items-center justify-between mt-1 bg-gray-900 p-2 rounded-md">
              <code className="text-teal-300 truncate">{anonymizationId}</code>
              <button
                onClick={() => onCopy(anonymizationId)}
                className="p-1 text-gray-400 hover:text-white transition"
                title="Copy ID"
              >
                <ClipboardIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this ID for de-anonymization. Keep it secure.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultDisplay;
