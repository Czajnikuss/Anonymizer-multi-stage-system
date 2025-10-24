import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-wider">
            Data Anonymization Service
          </h1>
        </div>
        <div className="text-sm text-gray-400">
            GDPR & Polish Law Compliant
        </div>
      </div>
    </header>
  );
};

export default Header;
