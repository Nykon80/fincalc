import type { Recipe, StyleSettings } from '../types';

// Function to process instruction markup for display
function processInstructionMarkup(instruction: string, ingredients: any[]): string {
    if (!instruction || !ingredients) return instruction;
    
    const ingredientMap = new Map(ingredients.map(ing => [ing.name.trim(), ing]));
    
    return instruction.replace(/{{(.*?)}}/g, (match, ingredientName) => {
        const trimmedName = ingredientName.trim();
        const ingredient = ingredientMap.get(trimmedName);
        if (ingredient) {
            return ingredient.name;
        }
        return trimmedName; // Fallback if ingredient not found
    });
}

function generatePageHTML(recipes: Recipe[], styles: StyleSettings): string {
    const recipesJson = JSON.stringify(recipes);

    // This function will be stringified and embedded in the final HTML
    const clientSideScript = () => {
        const recipesData = (window as any).recipesData;
        
        let ratings = JSON.parse(localStorage.getItem('recipeRatings') || '{}');
        const saveRatings = () => {
            localStorage.setItem('recipeRatings', JSON.stringify(ratings));
        };

        // Function to process instruction markup for display
        const processInstructionMarkup = (instruction, ingredients) => {
            if (!instruction || !ingredients) return instruction;
            
            const ingredientMap = new Map(ingredients.map(ing => [ing.name.trim(), ing]));
            
            return instruction.replace(/{{(.*?)}}/g, (match, ingredientName) => {
                const trimmedName = ingredientName.trim();
                const ingredient = ingredientMap.get(trimmedName);
                if (ingredient) {
                    return ingredient.name;
                }
                return trimmedName; // Fallback if ingredient not found
            });
        };

        const renderSingleRecipe = () => {
            document.body.innerHTML = ''; // Clear the body
            const recipeId = window.location.hash.substring(1);
            const recipe = recipesData.find((r: any) => r.id === recipeId);
            
            if (recipe) {
                const singleViewHtml = `
                    <div class="container mx-auto p-4 sm:p-6 lg:p-12">
                      <div class="max-w-4xl mx-auto">
                        <a href="${window.location.pathname}" class="inline-block mb-8 text-sm text-primary hover:underline">&larr; Назад ко всем рецептам</a>
                        <div class="bg-card-bg rounded-2xl shadow-xl overflow-hidden">
                            <img src="${recipe.imageUrl}" alt="${recipe.title}" class="w-full h-64 md:h-96 object-cover">
                            <div class="p-6 sm:p-8 md:p-10">
                                <span class="text-sm font-semibold text-primary uppercase">${recipe.category}</span>
                                <h1 class="text-4xl md:text-5xl font-bold text-heading mt-2">${recipe.title}</h1>
                                <p class="text-text mt-4 text-lg">${recipe.description}</p>
                                <div class="mt-6 text-base text-text/80 flex flex-col sm:flex-row gap-4 sm:gap-8 border-y border-gray-200 py-4">
                                    <span><strong class="text-heading">Время приготовления:</strong> ${recipe.cookTime} мин</span>
                                    <span><strong class="text-heading">Калорийность:</strong> ${recipe.calories} ккал</span>
                                </div>
                                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h2 class="text-2xl font-semibold text-heading mb-4">Ингредиенты:</h2>
                                        <ul class="list-disc list-inside text-text space-y-2">
                                            ${recipe.ingredients.map((ing: any) => `<li><strong>${ing.name}</strong> - ${ing.amount}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-semibold text-heading mb-4">Инструкции:</h2>
                                        <ol class="list-decimal list-inside text-text space-y-4">
                                             ${recipe.instructions.map((step: string) => `<li>${processInstructionMarkup(step, recipe.ingredients)}</li>`).join('')}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', singleViewHtml);
            } else {
                document.body.innerHTML = '<div class="text-center p-20"><h1 class="text-2xl font-bold text-heading">Рецепт не найден</h1><a href="/" class="mt-4 inline-block text-primary hover:underline">Вернуться на главную</a></div>';
            }
        };

        const initGridView = () => {
            const recipeGrid = document.getElementById('recipe-grid');
            const searchInput = document.getElementById('searchInput') as HTMLInputElement;
            const caloriesFilter = document.getElementById('caloriesFilter') as HTMLInputElement;
            const caloriesValue = document.getElementById('caloriesValue');
            const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
            const sortFilter = document.getElementById('sortFilter') as HTMLSelectElement;

            const renderRecipes = (recipesToRender: any[]) => {
                if (!recipeGrid) return;
                recipeGrid.innerHTML = recipesToRender.length > 0 ? recipesToRender.map(recipe => {
                    const rating = ratings[recipe.id] || 0;
                    const stars = Array(5).fill(0).map((_, i) => `
                        <svg data-value="${i + 1}" class="w-6 h-6 cursor-pointer ${i < rating ? 'text-amber-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    `).join('');
                    
                    const keyIngredients = recipe.ingredients.slice(0, 4);

                    return `
                    <a href="#${recipe.id}" target="_blank" class="recipe-card block bg-card-bg rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <img src="${recipe.imageUrl}" alt="${recipe.title}" class="w-full h-56 object-cover">
                        <div class="p-6 flex-grow flex flex-col">
                            <span class="text-sm font-semibold text-primary uppercase">${recipe.category}</span>
                            <h3 class="text-2xl font-bold text-heading mt-2">${recipe.title}</h3>
                            <p class="text-text mt-2 text-base flex-grow">${recipe.description}</p>
                            <div class="mt-4 text-sm text-text/80 flex justify-between">
                                <span><strong class="text-heading">Время:</strong> ${recipe.cookTime} мин</span>
                                <span><strong class="text-heading">Калории:</strong> ${recipe.calories} ккал</span>
                            </div>
                            
                            <div class="mt-4 border-t border-gray-200 pt-4">
                                <h4 class="text-sm font-semibold text-heading mb-2">Ключевые ингредиенты:</h4>
                                <ul class="list-disc list-inside text-text space-y-1 text-xs">
                                     ${keyIngredients.map((ing: any) => `<li>${ing.name}</li>`).join('')}
                                     ${recipe.ingredients.length > 4 ? `<li class="text-text/70">...и другие</li>` : ''}
                                </ul>
                            </div>

                            <div class="mt-auto pt-4 flex items-center justify-center gap-1" data-recipe-id="${recipe.id}">
                               ${stars}
                            </div>
                        </div>
                    </a>
                `;
                }).join('') : '<p class="text-center text-text col-span-full py-12">По вашему запросу рецептов не найдено.</p>';
            };

            const applyFiltersAndSort = () => {
                const searchTerm = searchInput.value.toLowerCase();
                const maxCalories = parseInt(caloriesFilter.value, 10);
                const selectedCategory = categoryFilter.value;
                const sortOption = sortFilter.value;

                let filtered = recipesData.filter((recipe: any) => {
                    const matchesSearch = searchTerm === '' || 
                                          recipe.title.toLowerCase().includes(searchTerm) ||
                                          recipe.description.toLowerCase().includes(searchTerm);
                    const matchesCalories = recipe.calories <= maxCalories;
                    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
                    return matchesSearch && matchesCalories && matchesCategory;
                });
                
                switch (sortOption) {
                    case 'time-asc': filtered.sort((a:any, b:any) => a.cookTime - b.cookTime); break;
                    case 'time-desc': filtered.sort((a:any, b:any) => b.cookTime - a.cookTime); break;
                    case 'cal-asc': filtered.sort((a:any, b:any) => a.calories - b.calories); break;
                    case 'cal-desc': filtered.sort((a:any, b:any) => b.calories - b.calories); break;
                    case 'title-asc': filtered.sort((a:any, b:any) => a.title.localeCompare(b.title)); break;
                    case 'title-desc': filtered.sort((a:any, b:any) => b.title.localeCompare(a.title)); break;
                }
                renderRecipes(filtered);
            };
            
            const getMaxCalories = () => recipesData.length > 0 ? Math.max(...recipesData.map((r: any) => r.calories)) : 1000;

            if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort);
            if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSort);
            if (sortFilter) sortFilter.addEventListener('change', applyFiltersAndSort);

            if (caloriesFilter && caloriesValue) {
                const maxCal = getMaxCalories();
                caloriesFilter.max = String(maxCal);
                caloriesFilter.value = String(maxCal);
                caloriesValue.textContent = String(maxCal);
                caloriesFilter.addEventListener('input', () => {
                    caloriesValue.textContent = caloriesFilter.value;
                    applyFiltersAndSort();
                });
            }
            
            if (recipeGrid) {
                recipeGrid.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    const star = target.closest('svg[data-value]');
                    if (star) {
                        e.preventDefault(); // Prevent link navigation when clicking a star
                        const rating = star.getAttribute('data-value');
                        const recipeId = (star.closest('[data-recipe-id]') as HTMLElement).dataset.recipeId;
                        if (rating && recipeId) {
                            ratings[recipeId] = parseInt(rating, 10);
                            saveRatings();
                            applyFiltersAndSort(); // Re-render to update stars
                        }
                    }
                });
            }

            // Initial Render
            applyFiltersAndSort();
        };
        
        // --- MAIN ROUTER ---
        if (window.location.hash) {
            renderSingleRecipe();
        } else {
            initGridView();
        }
    };

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Моя Книга Рецептов</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
        :root {
            --font-family: '${styles.fontFamily}';
            --primary-color: ${styles.primaryColor};
            --background-color: ${styles.backgroundColor};
            --text-color: ${styles.textColor};
            --card-background-color: ${styles.cardBackgroundColor};
            --heading-color: ${styles.headingColor};
        }
    </style>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['${styles.fontFamily}', 'sans-serif'],
                    },
                    colors: {
                        primary: 'var(--primary-color)',
                        'bg-main': 'var(--background-color)',
                        'text': 'var(--text-color)',
                        'card-bg': 'var(--card-background-color)',
                        'heading': 'var(--heading-color)',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-bg-main font-sans text-text">
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
        <header class="text-center my-8">
            <h1 class="text-5xl font-bold text-heading">Книга Рецептов</h1>
            <p class="text-text/80 mt-2">Лучшие блюда, собранные в одном месте</p>
        </header>
        
        <div class="sticky top-0 z-10 bg-bg-main/80 backdrop-blur-sm py-4 mb-8 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-card-bg shadow-md rounded-lg">
                <div>
                    <label for="searchInput" class="block text-sm font-medium text-heading">Поиск по названию</label>
                    <input type="text" id="searchInput" placeholder="Например, 'курица'" class="mt-1 block w-full bg-gray-100 text-gray-800 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary">
                </div>
                 <div>
                    <label for="categoryFilter" class="block text-sm font-medium text-heading">Категория</label>
                    <select id="categoryFilter" class="mt-1 block w-full bg-gray-100 text-gray-800 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                        <option value="all">Все категории</option>
                        ${[...new Set(recipes.map(r => r.category))].map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                  <label for="sortFilter" class="block text-sm font-medium text-heading">Сортировка</label>
                  <select id="sortFilter" class="mt-1 block w-full bg-gray-100 text-gray-800 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                    <option value="default">По умолчанию</option>
                    <option value="title-asc">Название (А-Я)</option>
                    <option value="title-desc">Название (Я-А)</option>
                    <option value="time-asc">Время (сначала быстрые)</option>
                    <option value="time-desc">Время (сначала долгие)</option>
                    <option value="cal-asc">Калории (сначала легкие)</option>
                    <option value="cal-desc">Калории (сначала сытные)</option>
                  </select>
                </div>
                <div>
                    <label for="caloriesFilter" class="block text-sm font-medium text-heading">Калории до: <span id="caloriesValue" class="font-bold text-primary"></span></label>
                    <input type="range" id="caloriesFilter" min="0" step="10" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>
            </div>
        </div>

        <main>
            <div id="recipe-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Recipes will be injected here -->
            </div>
        </main>
    </div>
    <script>
        window.recipesData = ${recipesJson};
        const scriptToRun = ${clientSideScript.toString()};
        document.addEventListener('DOMContentLoaded', scriptToRun);
    </script>
</body>
</html>
`;
}


export function exportPage(recipes: Recipe[], styles: StyleSettings): void {
  const pageHtml = generatePageHTML(recipes, styles);
  const blob = new Blob([pageHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recipes.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}