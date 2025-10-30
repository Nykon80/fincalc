
import React from 'react';
import type { Recipe } from '../types';
import { PencilIcon, TrashIcon } from './icons';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-40 object-cover" />
      <div className="p-4 flex-grow flex flex-col">
        <span className="text-xs font-semibold text-fuchsia-600 uppercase">{recipe.category}</span>
        <h3 className="text-lg font-bold text-gray-800 mt-1 mb-2 truncate">{recipe.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 flex-grow">{recipe.description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors">
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
