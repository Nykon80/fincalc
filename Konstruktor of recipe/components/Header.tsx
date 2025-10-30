
import React from 'react';
import { DownloadIcon } from './icons';

interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                R
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Конструктор Рецептов</h1>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
          >
            <DownloadIcon className="w-5 h-5" />
            Экспорт страницы
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
