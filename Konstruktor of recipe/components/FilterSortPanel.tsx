import React from 'react';
import { SearchIcon } from './icons';

interface FilterSortPanelProps {
    categories: string[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filterCategory: string;
    onFilterCategoryChange: (category: string) => void;
}

const FilterSortPanel: React.FC<FilterSortPanelProps> = ({
    categories,
    searchTerm,
    onSearchChange,
    filterCategory,
    onFilterCategoryChange,
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="md:col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Поиск по названию</label>
                    <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                             <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Например, борщ..."
                            className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="md:col-span-1">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                    <select
                        id="category"
                        value={filterCategory}
                        onChange={(e) => onFilterCategoryChange(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm"
                    >
                        <option value="Все">Все категории</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FilterSortPanel;