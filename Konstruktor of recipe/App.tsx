import React, { useState, useCallback, useEffect } from 'react';
import type { Recipe, StyleSettings } from './types';
import { INITIAL_RECIPES, DEFAULT_STYLE_SETTINGS, CATEGORIES as INITIAL_CATEGORIES } from './constants';
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import StyleEditor from './components/StyleEditor';
import RecipeForm from './components/RecipeForm';
import { PlusIcon } from './components/icons';
import { exportPage } from './services/exportService';

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const savedRecipes = localStorage.getItem('recipes');
      return savedRecipes ? JSON.parse(savedRecipes) : INITIAL_RECIPES;
    } catch (error) {
      console.error("Could not parse recipes from localStorage", error);
      return INITIAL_RECIPES;
    }
  });

  const [styles, setStyles] = useState<StyleSettings>(DEFAULT_STYLE_SETTINGS);

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const savedCategories = localStorage.getItem('recipeCategories');
      return savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES;
    } catch (error) {
      console.error("Could not parse categories from localStorage", error);
      return INITIAL_CATEGORIES;
    }
  });

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('recipeCategories', JSON.stringify(categories));
  }, [categories]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRecipe(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRecipe(null);
  };

  const handleAddCategory = useCallback((newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory].sort());
    }
  }, [categories]);

  const handleSaveRecipe = (recipe: Recipe) => {
    handleAddCategory(recipe.category);
    setRecipes(prevRecipes => {
      const existing = prevRecipes.find(r => r.id === recipe.id);
      if (existing) {
        return prevRecipes.map(r => r.id === recipe.id ? recipe : r);
      }
      return [...prevRecipes, recipe];
    });
    handleCloseForm();
  };

  const handleDeleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setIsFormOpen(false);
    setSelectedRecipe(null);
  }, []);
  
  const handleDeleteCategory = useCallback((categoryToDelete: string) => {
    if (categoryToDelete === "Без категории") return; // Prevent deleting the default category

    setCategories(prev => prev.filter(c => c !== categoryToDelete));

    // Re-categorize recipes that used the deleted category
    setRecipes(prevRecipes =>
        prevRecipes.map(recipe => {
            if (recipe.category === categoryToDelete) {
                return { ...recipe, category: "Без категории" };
            }
            return recipe;
        })
    );
  }, []);

  const handleExport = () => {
    exportPage(recipes, styles);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header onExport={handleExport} />

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Ваши рецепты</h1>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Добавить рецепт</span>
              </button>
            </div>
            
            {recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onEdit={() => handleSelectRecipe(recipe)}
                    onDelete={() => handleDeleteRecipe(recipe.id)}
                  />
                ))}
              </div>
            ) : (
                 <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-gray-700">У вас пока нет рецептов</h3>
                    <p className="text-gray-500 mt-2">Нажмите "Добавить рецепт", чтобы начать.</p>
                </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
             <StyleEditor 
                styles={styles} 
                setStyles={setStyles}
              />
          </div>
        </div>
      </main>

      {isFormOpen && (
        <RecipeForm
          recipe={selectedRecipe}
          onSave={handleSaveRecipe}
          onClose={handleCloseForm}
          onDelete={handleDeleteRecipe}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
    </div>
  );
};

export default App;