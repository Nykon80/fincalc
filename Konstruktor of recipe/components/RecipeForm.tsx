import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Recipe, Ingredient } from '../types';
import { generateRecipeFromPrompt, generateImageFromPrompt, updateInstructionsFromIngredients, markupInstruction } from '../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, XIcon, LinkIcon, UploadIcon, WandSparklesIcon, DownloadIcon, RefreshIcon } from './icons';

type ImageSource = 'url' | 'upload' | 'generate';

interface RecipeFormProps {
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

// ====================================================================================
// INSTRUCTION PROCESSING LOGIC
// ====================================================================================

/**
 * Processes a list of marked-up instructions to produce the final display text.
 * If `addAmounts` is true, it will inject the ingredient amount only the *first* time
 * an ingredient is mentioned across all instructions.
 * @param markedUpInstructions Array of instruction strings with markup like "{{ingredient}}".
 * @param ingredients The full list of ingredients for the recipe.
 * @param addAmounts Boolean flag to control whether amounts are added.
 * @returns An array of processed instruction strings ready for display.
 */
const processInstructionsForDisplay = (
  markedUpInstructions: string[],
  ingredients: Ingredient[],
  addAmounts: boolean
): string[] => {
  if (!markedUpInstructions) return [];
  // Trim names to protect against user input with extra spaces
  const ingredientMap = new Map(ingredients.map(ing => [ing.name.trim(), ing]));

  if (!addAmounts) {
    // Simple case: just remove markup and show ingredient names.
    return markedUpInstructions.map(text =>
      text.replace(/{{(.*?)}}/g, (match, ingredientName) => ingredientName.trim())
    );
  }

  // Complex case: add amounts only on first mention.
  const mentionedIngredients = new Set<string>();

  return markedUpInstructions.map(markedUpText => {
    return markedUpText.replace(/{{(.*?)}}/g, (match, ingredientName) => {
      const trimmedName = ingredientName.trim();
      const ingredient = ingredientMap.get(trimmedName);
      if (ingredient) {
        // Check if we should add the amount:
        // 1. The ingredient has an amount.
        // 2. We haven't mentioned this ingredient with its amount yet.
        if (ingredient.amount && !mentionedIngredients.has(trimmedName)) {
          mentionedIngredients.add(trimmedName); // Mark as mentioned
          return `${ingredient.name} (${ingredient.amount})`;
        }
        // If already mentioned or no amount, just return the name.
        return ingredient.name;
      }
      return trimmedName; // Fallback if ingredient not in map
    });
  });
};


// ====================================================================================

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSave, onClose, onDelete, categories, onAddCategory, onDeleteCategory }) => {
  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>({
    title: '',
    category: categories[0] || '',
    imageUrl: '',
    description: '',
    ingredients: [],
    instructions: [],
    calories: 0,
    cookTime: 0,
  });

  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [useGrounding, setUseGrounding] = useState(true);
  
  const [imageSource, setImageSource] = useState<ImageSource>('url');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [shouldInjectAmounts, setShouldInjectAmounts] = useState(false);
  const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]);

  // State for handling live instruction edits and markup
  const [instructionEdits, setInstructionEdits] = useState<Record<number, string>>({});
  const [markingUpIndex, setMarkingUpIndex] = useState<number | null>(null);

  const haveIngredientsChanged = useMemo(() => {
    if (formData.ingredients.length !== originalIngredients.length) return true;
    
    const originalIngredientsSet = new Set(
        originalIngredients.map(i => `${i.name.trim()}|${i.amount.trim()}`)
    );

    for (const ing of formData.ingredients) {
        if (!originalIngredientsSet.has(`${ing.name.trim()}|${ing.amount.trim()}`)) {
            return true;
        }
    }

    return false;
  }, [formData.ingredients, originalIngredients]);


  useEffect(() => {
    if (recipe) {
      setShouldInjectAmounts(false); // Default to unchecked for existing recipes
      const initialIngredients = recipe.ingredients || [];
      setFormData({
        ...recipe,
        instructions: recipe.instructions || []
      });
      setOriginalIngredients(JSON.parse(JSON.stringify(initialIngredients))); // deep copy
      setInstructionEdits({}); // Clear edits when recipe changes

      if (recipe.imageUrl.startsWith('data:image')) {
        setImageSource('upload');
      } else {
        setImageSource('url');
      }
    } else {
      setShouldInjectAmounts(true); // Default to checked for new recipes
      const initialIngredients = [{ id: crypto.randomUUID(), name: '', amount: '' }];
      setFormData({
        title: '',
        category: categories[0] || '',
        imageUrl: `https://picsum.photos/seed/${Date.now()}/600/400`,
        description: '',
        ingredients: initialIngredients,
        instructions: [''],
        calories: 0,
        cookTime: 0,
      });
      setOriginalIngredients([]);
      setInstructionEdits({}); // Clear edits for new recipe
      setImageSource('url');
    }
  }, [recipe, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'calories' || name === 'cookTime' ? Number(value) : value }));
  };
  
  const handleIngredientChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({...prev, ingredients: [...prev.ingredients, { id: crypto.randomUUID(), name: '', amount: ''}]}));
  };
  
  const removeIngredient = (index: number) => {
    setFormData(prev => ({...prev, ingredients: prev.ingredients.filter((_, i) => i !== index)}));
  };
  
  const handleInstructionChange = (index: number, value: string) => {
    setInstructionEdits(prev => ({ ...prev, [index]: value }));
  };
  
  const handleInstructionBlur = async (index: number, value: string) => {
    const originalDisplayedText = processInstructionsForDisplay([formData.instructions[index]], formData.ingredients, shouldInjectAmounts)[0];
    
    // Only call API if the text has actually been changed
    if (value.trim() === originalDisplayedText.trim()) {
        const newEdits = { ...instructionEdits };
        delete newEdits[index];
        setInstructionEdits(newEdits);
        return;
    }

    setMarkingUpIndex(index);
    try {
        const newMarkedUpText = await markupInstruction(value, formData.ingredients);
        const newInstructions = [...formData.instructions];
        newInstructions[index] = newMarkedUpText;
        setFormData(prev => ({ ...prev, instructions: newInstructions }));
        
        const newEdits = { ...instructionEdits };
        delete newEdits[index];
        setInstructionEdits(newEdits);
    } catch (error) {
        console.error("Failed to markup instruction:", error);
        alert("Не удалось распознать ингредиенты в этом шаге. Проверьте соединение с интернетом.");
    } finally {
        setMarkingUpIndex(null);
    }
  };


  const handleShouldInjectAmountsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShouldInjectAmounts(e.target.checked);
  };

  const addInstruction = () => {
    setFormData(prev => ({...prev, instructions: [...prev.instructions, '']}));
  };
  
  const removeInstruction = (index: number) => {
    setFormData(prev => ({...prev, instructions: prev.instructions.filter((_, i) => i !== index)}));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Пожалуйста, выберите файл изображения.");
    }
  };

  const handleGenerateImage = async () => {
    const { title, description, ingredients } = formData;

    if (!title) {
        alert("Пожалуйста, введите название рецепта, чтобы сгенерировать изображение.");
        return;
    }

    const ingredientList = ingredients
        .map(ing => ing.name)
        .filter(Boolean)
        .join(', ');

    const detailedPrompt = `
      Создай фотореалистичное изображение готового блюда.
      
      **Основа изображения:** "${title}".
      
      **Уточнения для точности (контекст из рецепта):**
      1.  **Описание блюда:** ${description || 'Нет описания.'}
      2.  **Состав:** ${ingredientList || 'Нет ингредиентов.'}
      
      **Ключевые требования к изображению:**
      -   **Готовое блюдо:** Изобрази финальный результат, поданный на тарелке, а не процесс готовки или отдельные сырые ингредиенты.
      -   **Точность:** Внешний вид блюда должен строго соответствовать рецепту. Например, если в рецепте указаны "нарезанные кубиками ананасы", не показывай их целыми кольцами. Пропорции ингредиентов на фото должны выглядеть реалистично и соответствовать описанию.
      -   **Стиль:** Профессиональная фуд-фотография для кулинарной книги. Аппетитная подача, красивое освещение, высокое разрешение.
    `;
    
    setIsGeneratingImage(true);
    try {
        const result = await generateImageFromPrompt(detailedPrompt);
        setFormData(prev => ({ ...prev, imageUrl: result }));
    } catch(error) {
        console.error("Failed to generate image:", error);
        if (error instanceof Error) {
            alert(error.message);
        } else {
             alert("Произошла неизвестная ошибка при генерации изображения.");
        }
    } finally {
        setIsGeneratingImage(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipeToSave: Recipe = {
        ...formData,
        id: recipe?.id || crypto.randomUUID(),
        instructions: formData.instructions // Save raw instructions with markup
    };
    onSave(recipeToSave);
  };
  
  const handleGenerateRecipe = async () => {
    if (!geminiPrompt) return;
    setIsGenerating(true);
    try {
        const generatedRecipe = await generateRecipeFromPrompt(geminiPrompt, useGrounding);
        if (generatedRecipe) {
             // Reset markup state when loading new AI data
            setShouldInjectAmounts(true);
            setFormData(prev => ({
                ...prev,
                ...generatedRecipe,
                imageUrl: prev.imageUrl || `https://picsum.photos/seed/${generatedRecipe.title.replace(/\s/g, '-')}/600/400`,
            }));
            setOriginalIngredients(JSON.parse(JSON.stringify(generatedRecipe.ingredients)));
        }
    } catch (error) {
        console.error("Failed to generate recipe:", error);
        alert("Не удалось сгенерировать рецепт. Пожалуйста, попробуйте еще раз. Если включена сверка с интернетом, попробуйте ее отключить.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleUpdateInstructions = async () => {
    setIsUpdating(true);
    try {
        const recipeContext = { ...formData };
        const updatedInstructions = await updateInstructionsFromIngredients(recipeContext);
        if (updatedInstructions) {
            setFormData(prev => ({ ...prev, instructions: updatedInstructions }));
            setOriginalIngredients(JSON.parse(JSON.stringify(formData.ingredients)));
        } else {
             alert("Не удалось получить обновленные инструкции. Ответ от сервера был пуст.");
        }
    } catch (error) {
        console.error("Failed to update instructions:", error);
        alert("Не удалось обновить инструкции. Пожалуйста, попробуйте еще раз.");
    } finally {
        setIsUpdating(false);
    }
  };
  
  const handleCreateNewCategory = () => {
      const trimmedName = newCategoryName.trim();
      if (trimmedName && !categories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
          onAddCategory(trimmedName);
          setFormData(prev => ({ ...prev, category: trimmedName }));
          setNewCategoryName('');
      } else if (!trimmedName) {
          alert("Название категории не может быть пустым.");
      } else {
          alert("Такая категория уже существует.");
      }
  };
  
  const handleDownloadImage = () => {
    if (!formData.imageUrl.startsWith('data:image')) return;

    const link = document.createElement('a');
    link.href = formData.imageUrl;
    
    const safeTitle = formData.title.trim().replace(/[^a-z0-9а-яё_.-]/gi, '_').toLowerCase();
    let filename = 'recipe-image.png';

    if (safeTitle) {
      filename = `${safeTitle}.png`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageSourceOptions: { id: ImageSource, label: string, icon: React.ReactNode }[] = [
    { id: 'url', label: 'URL', icon: <LinkIcon className="w-5 h-5"/> },
    { id: 'upload', label: 'Загрузить', icon: <UploadIcon className="w-5 h-5"/> },
    { id: 'generate', label: 'Сгенерировать', icon: <WandSparklesIcon className="w-5 h-5"/> },
  ];
  
  const displayedInstructions = processInstructionsForDisplay(formData.instructions, formData.ingredients, shouldInjectAmounts);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start py-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 relative animate-fade-in-up">

        {isManagingCategories && (
             <div className="absolute inset-0 bg-white z-20 rounded-lg p-6 sm:p-8 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-800">Управление категориями</h3>
                    <button type="button" onClick={() => setIsManagingCategories(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200" aria-label="Закрыть управление категориями">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
                    <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700 mb-1">Добавить новую категорию</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="new-category-name"
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Название категории"
                            className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleCreateNewCategory}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-fuchsia-300"
                            disabled={!newCategoryName.trim()}
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Добавить</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                    {categories.map(category => (
                        <div key={category} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                            <span className="text-sm text-gray-700">{category}</span>
                            {category !== "Без категории" && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (formData.category === category) {
                                            setFormData(prev => ({ ...prev, category: "Без категории" }));
                                        }
                                        onDeleteCategory(category);
                                    }} 
                                    className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                    aria-label={`Удалить категорию ${category}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="mt-4 pt-4 border-t text-center flex-shrink-0">
                    <button type="button" onClick={() => setIsManagingCategories(false)} className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 border border-transparent rounded-md shadow-sm hover:bg-fuchsia-700">
                        Готово
                    </button>
                </div>
            </div>
        )}

        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{recipe ? 'Редактировать рецепт' : 'Создать рецепт'}</h2>
                <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="mb-6 p-4 border border-fuchsia-200 bg-fuchsia-50 rounded-lg">
                <label htmlFor="gemini-prompt" className="block text-sm font-medium text-fuchsia-800 mb-2">Сгенерировать рецепт с помощью ИИ</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="gemini-prompt"
                        value={geminiPrompt}
                        onChange={(e) => setGeminiPrompt(e.target.value)}
                        placeholder="Например, 'паста карбонара'"
                        className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleGenerateRecipe}
                        disabled={isGenerating || !geminiPrompt}
                        className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 disabled:bg-fuchsia-300 disabled:cursor-not-allowed transition-colors"
                    >
                       {isGenerating ? 
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         : <SparklesIcon className="w-5 h-5"/>
                       }
                        <span>{isGenerating ? 'Генерация...' : 'Создать'}</span>
                    </button>
                </div>
                <div className="mt-3 flex items-center">
                    <button
                        type="button"
                        onClick={() => setUseGrounding(!useGrounding)}
                        className={`${useGrounding ? 'bg-fuchsia-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2`}
                        role="switch"
                        aria-checked={useGrounding}
                        >
                        <span
                            aria-hidden="true"
                            className={`${useGrounding ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        ></span>
                    </button>
                    <label onClick={() => setUseGrounding(!useGrounding)} className="ml-3 text-sm text-gray-600 cursor-pointer">
                        Сверить с рецептами в интернете
                    </label>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[65vh] overflow-y-auto pr-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Название</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Категория
                    <button type="button" onClick={() => setIsManagingCategories(true)} className="ml-2 text-xs font-medium text-fuchsia-600 hover:text-fuchsia-800 hover:underline focus:outline-none">
                        (управлять)
                    </button>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Источник изображения</label>
                    <div className="isolate flex rounded-md shadow-sm w-full">
                        {imageSourceOptions.map((option, index) => (
                           <button
                                type="button"
                                key={option.id}
                                onClick={() => setImageSource(option.id)}
                                className={`relative inline-flex items-center justify-center gap-2 w-1/3 px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 transition-colors duration-150
                                ${index === 0 ? 'rounded-l-md' : ''}
                                ${index === imageSourceOptions.length - 1 ? 'rounded-r-md' : '-ml-px'}
                                ${imageSource === option.id ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                     <div className="pt-1">
                        {imageSource === 'url' && (
                             <input type="text" name="imageUrl" placeholder="https://example.com/image.jpg" value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                        )}
                        {imageSource === 'upload' && (
                             <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100" />
                        )}
                        {imageSource === 'generate' && (
                           <div className="flex">
                                <button
                                    type="button"
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage || !formData.title}
                                    className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 disabled:bg-fuchsia-300 disabled:cursor-not-allowed"
                                >
                                     {isGeneratingImage ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Генерация...</span>
                                        </>
                                     ) : (
                                        <>
                                            <SparklesIcon className="w-5 h-5"/>
                                            <span>Сгенерировать по рецепту</span>
                                        </>
                                     )}
                                </button>
                            </div>
                        )}
                    </div>
                    {formData.imageUrl && (
                        <div className="mt-2 relative group">
                            <img src={formData.imageUrl} alt="Предпросмотр" className="w-full h-48 object-cover rounded-md border" />
                             {formData.imageUrl.startsWith('data:image') && (
                                <button
                                    type="button"
                                    onClick={handleDownloadImage}
                                    className="absolute top-2 right-2 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 focus:opacity-100 transition-all duration-300 opacity-0 group-hover:opacity-100"
                                    aria-label="Скачать изображение"
                                    title="Скачать изображение"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
                    <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700">Время готовки (мин)</label>
                        <input type="number" name="cookTime" id="cookTime" min="0" value={formData.cookTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="calories" className="block text-sm font-medium text-gray-700">Калории</label>
                        <input type="number" name="calories" id="calories" min="0" value={formData.calories} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                    </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Ингредиенты</h3>
                    {formData.title && (
                      <button
                        type="button"
                        onClick={handleUpdateInstructions}
                        disabled={!haveIngredientsChanged || isUpdating}
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-fuchsia-700 bg-fuchsia-100 rounded-full hover:bg-fuchsia-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {isUpdating ? (
                            <div className="w-4 h-4 border-2 border-fuchsia-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <RefreshIcon className="w-4 h-4" />
                        )}
                        <span>{isUpdating ? 'Обновление...' : 'Обновить инструкции'}</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {formData.ingredients.map((ing, index) => (
                      <div key={ing.id} className="flex items-center gap-2">
                        <input type="text" placeholder="Название" value={ing.name} onChange={e => handleIngredientChange(index, 'name', e.target.value)} className="w-1/2 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                        <input type="text" placeholder="Количество" value={ing.amount} onChange={e => handleIngredientChange(index, 'amount', e.target.value)} className="w-1/2 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm" />
                        <button type="button" onClick={() => removeIngredient(index)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    ))}
                  </div>
                   <button type="button" onClick={addIngredient} className="mt-2 flex items-center gap-2 text-sm text-fuchsia-600 hover:text-fuchsia-800"><PlusIcon className="w-4 h-4" />Добавить ингредиент</button>
                </div>
                
                {/* Instructions */}
                <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Инструкции</h3>
                    <div className="flex items-center space-x-2 mb-3 bg-gray-50 p-2 rounded-md">
                        <input
                            type="checkbox"
                            id="inject-amounts"
                            checked={shouldInjectAmounts}
                            onChange={handleShouldInjectAmountsChange}
                            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                        />
                        <label htmlFor="inject-amounts" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                            Указывать количество ингредиентов в инструкциях
                        </label>
                   </div>
                  <div className="space-y-3">
                    {formData.instructions.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">{index + 1}.</span>
                        <div className="relative flex-grow">
                            <textarea 
                                value={instructionEdits[index] ?? displayedInstructions[index]} 
                                onChange={e => handleInstructionChange(index, e.target.value)}
                                onBlur={e => handleInstructionBlur(index, e.target.value)}
                                rows={2} 
                                className="w-full block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                            ></textarea>
                            {markingUpIndex === index && (
                                <div className="absolute top-2 right-2 text-gray-400">
                                    <RefreshIcon className="w-5 h-5 animate-spin"/>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => removeInstruction(index)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addInstruction} className="mt-2 flex items-center gap-2 text-sm text-fuchsia-600 hover:text-fuchsia-800"><PlusIcon className="w-4 h-4" />Добавить шаг</button>
                </div>
            </form>
            
             <div className="pt-6 flex justify-between items-center">
                 <div>
                    {recipe && (
                        <button onClick={() => onDelete(recipe.id)} className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md">
                            Удалить рецепт
                        </button>
                    )}
                 </div>
                <div className="flex gap-4">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200">Отмена</button>
                  <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 border border-transparent rounded-md shadow-sm hover:bg-fuchsia-700">Сохранить</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;