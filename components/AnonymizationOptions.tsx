import React from 'react';
import { AnonymizationStrategy } from '../types';

interface AnonymizationOptionsProps {
  strategy: AnonymizationStrategy;
  setStrategy: (strategy: AnonymizationStrategy) => void;
}

const options = [
  { id: AnonymizationStrategy.TAG, label: 'Tagging', description: 'Replace PII with configurable tags (e.g., [PERSON_1]).' },
  { id: AnonymizationStrategy.REPLACE, label: 'Replacement', description: 'Substitute PII with random, fabricated data.' },
  { id: AnonymizationStrategy.REMOVE, label: 'Removal', description: 'Completely remove PII from the text.' },
];

const AnonymizationOptions: React.FC<AnonymizationOptionsProps> = ({ strategy, setStrategy }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-white">Anonymization Strategy</h3>
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => setStrategy(option.id)}
            className={`p-3 rounded-md cursor-pointer transition-all duration-200 border-2 ${
              strategy === option.id ? 'bg-cyan-900 border-cyan-600' : 'bg-gray-700 border-transparent hover:border-cyan-700'
            }`}
          >
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value={option.id}
                checked={strategy === option.id}
                onChange={() => setStrategy(option.id)}
                className="hidden" 
              />
              <div className="ml-2">
                <p className="font-bold text-gray-100">{option.label}</p>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnonymizationOptions;
