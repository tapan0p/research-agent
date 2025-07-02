// src/components/Navbar.jsx
import React from 'react';
import { Brain } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-black/60 backdrop-blur-md border-b border-blue-800/30 sticky top-0 z-10 h-[70px]">
      <div className="max-w-7xl mx-auto px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              AI Research Assistant
            </h1>
            <p className="text-sm text-gray-300">Intelligent research, analysis & synthesis</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
