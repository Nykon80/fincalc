import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Recipe, Ingredient } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: 'Название блюда на русском языке.',
        },
        category: {
            type: Type.STRING,
            description: 'Категория блюда (например, Супы, Десерты, Мясные блюда).',
        },
        description: {
            type: Type.STRING,
            description: 'Краткое, аппетитное описание блюда на 2-3 предложения.',
        },
        ingredients: {
            type: Type.ARRAY,
            description: 'Список ингредиентов.',
            items: {
                type: Type.OBJECT,
                properties: {
                     id: {
                        type: Type.STRING,
                        description: 'Уникальный идентификатор ингредиента, сгенерированный с помощью crypto.randomUUID().'
                    },
                    name: {
                        type: Type.STRING,
                        description: 'Название ингредиента.',
                    },
                    amount: {
                        type: Type.STRING,
                        description: 'Количество и единицы измерения (например, "200 г" или "1 шт").',
                    },
                },
                 required: ['id', 'name', 'amount'],
            }
        },
        instructions: {
            type: Type.ARRAY,
            description: "Пошаговая инструкция приготовления. В тексте инструкций, каждое упоминание ингредиента должно быть обернуто в двойные фигурные скобки. Например: 'Смешайте {{Мука}} и {{Сахар}}'. Название внутри скобок должно ТОЧНО соответствовать названию из списка ингредиентов.",
            items: {
                type: Type.STRING,
            }
        },
        calories: {
            type: Type.INTEGER,
            description: 'Примерное количество калорий на порцию.',
        },
        cookTime: {
            type: Type.INTEGER,
            description: 'Общее время приготовления в минутах.',
        }
    },
    required: ['title', 'category', 'description', 'ingredients', 'instructions', 'calories', 'cookTime'],
};

export const generateRecipeFromPrompt = async (prompt: string, useGrounding: boolean): Promise<Omit<Recipe, 'id' | 'imageUrl'> | null> => {
  try {
    let response;
    let fullPrompt;

    if (useGrounding) {
        fullPrompt = `Создай подробный рецепт для блюда: "${prompt}", основываясь на популярных рецептах из интернета. Ответ должен быть на русском языке в формате JSON, который строго соответствует этой структуре: 
        {
          "title": "string",
          "category": "string",
          "description": "string",
          "ingredients": [{ "name": "string", "amount": "string" }],
          "instructions": ["string with {{ingredient}} markup"],
          "calories": "integer",
          "cookTime": "integer"
        }. 
        В тексте инструкций, каждое упоминание ингредиента должно быть обернуто в двойные фигурные скобки. Например: 'Смешайте {{Мука}} и {{Сахар}}'. Название внутри скобок должно ТОЧНО соответствовать названию из списка ингредиентов.`;
        
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
    } else {
        fullPrompt = `Создай подробный рецепт для блюда: "${prompt}". Ответ должен быть на русском языке и строго соответствовать предоставленной JSON схеме. Для каждого ингредиента сгенерируй уникальный id с помощью crypto.randomUUID(). В тексте инструкций, каждое упоминание ингредиента должно быть обернуто в двойные фигурные скобки. Например: 'Смешайте {{Мука}} и {{Сахар}}'. Название внутри скобок должно ТОЧНО соответствовать названию из списка ингредиентов.`;
        
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });
    }

    let jsonText = response.text.trim();
     if (!jsonText) {
        console.error("Gemini API returned an empty response.");
        return null;
    }

    // Clean up potential markdown formatting if grounding is used
    if (useGrounding) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(jsonText) as Omit<Recipe, 'id' | 'imageUrl' | 'ingredients'> & { ingredients: Omit<Ingredient, 'id'>[] };

    // Ensure ingredients have unique IDs, as the model might not generate them correctly
    const ingredientsWithIds: Ingredient[] = parsedData.ingredients.map(ing => ({
        ...ing,
        id: crypto.randomUUID()
    }));
    
    return { ...parsedData, ingredients: ingredientsWithIds };

  } catch (error) {
    console.error("Error generating recipe with Gemini:", error);
    throw error; // Re-throw the error to be caught in the component
  }
};

const instructionsUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        instructions: {
            type: Type.ARRAY,
            description: "Обновленная пошаговая инструкция. Каждый элемент - один шаг. Ингредиенты должны быть обернуты в {{двойные фигурные скобки}}, и их названия должны точно соответствовать списку ингредиентов.",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ['instructions']
};

export const updateInstructionsFromIngredients = async (
    recipeData: Omit<Recipe, 'id' | 'imageUrl'>
): Promise<string[] | null> => {
    try {
        const { title, description, ingredients, instructions } = recipeData;
        const ingredientList = ingredients.map(ing => `- ${ing.name}: ${ing.amount}`).join('\n');
        
        const prompt = `
Ты — помощник шеф-повара. Тебе дан рецепт "${title}".
Пользователь изменил список ингредиентов. Твоя задача — аккуратно обновить **только шаги приготовления**, чтобы они соответствовали новому списку ингредиентов. Не меняй стиль, сложность или суть блюда.

**Контекст:**
- **Название:** ${title}
- **Описание:** ${description}
- **Старые инструкции (для справки):** \n${instructions.map((step, i) => `${i+1}. ${step}`).join('\n')}
- **НОВЫЙ список ингредиентов:** \n${ingredientList}

Пожалуйста, предоставь обновленные инструкции в формате JSON, соответствующем схеме. Каждый ингредиент в тексте инструкций должен быть обернут в двойные фигурные скобки, например, {{${ingredients[0]?.name || 'Ингредиент'}}}.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: instructionsUpdateSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            console.error("Gemini API returned an empty response for instructions update.");
            return null;
        }

        const parsedData = JSON.parse(jsonText) as { instructions: string[] };
        return parsedData.instructions;

    } catch (error) {
        console.error("Error updating instructions with Gemini:", error);
        throw error;
    }
};

export const markupInstruction = async (instructionText: string, ingredients: Ingredient[]): Promise<string> => {
    try {
        if (!instructionText.trim() || ingredients.length === 0) {
            return instructionText;
        }

        const ingredientNames = ingredients.map(ing => ing.name).filter(Boolean).join(', ');

        const prompt = `
            You are a text-processing bot. Your task is to find mentions of ingredients in a sentence and wrap them in double curly braces \`{{...}}\`. Use the exact ingredient name from the provided list. Respond with ONLY the modified sentence, without any explanations or markdown.

            Ingredient List: "${ingredientNames}"

            Sentence to process: "${instructionText}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const markedUpText = response.text.trim();
        return markedUpText || instructionText; // Fallback to original text if response is empty

    } catch (error) {
        console.error("Error marking up instruction with Gemini:", error);
        // In case of error, return the original text so the user doesn't lose their input
        return instructionText;
    }
};


export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Фотореалистичное изображение еды в высоком разрешении, студийный свет, аппетитный вид: ${prompt}` }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Check for safety blocks or other reasons for no content
        if (!response.candidates || response.candidates.length === 0) {
            const blockReason = response.promptFeedback?.blockReason;
            if (blockReason) {
                 throw new Error(`Запрос на генерацию изображения был заблокирован (${blockReason}). Пожалуйста, измените ваш запрос.`);
            }
            throw new Error("API не вернул результат. Попробуйте еще раз.");
        }
        
        const firstCandidate = response.candidates[0];

        if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP' && firstCandidate.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
             if (firstCandidate.finishReason === 'NO_IMAGE') {
                throw new Error("Не удалось создать изображение по вашему запросу. Пожалуйста, попробуйте быть более конкретным или измените описание.");
            }
            throw new Error(`Генерация изображения была остановлена по причине: ${firstCandidate.finishReason}. Пожалуйста, измените ваш запрос.`);
        }

        if (firstCandidate.content?.parts) {
            for (const part of firstCandidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        // If we get here, no image was returned for an unknown reason.
        throw new Error("Не удалось извлечь изображение из ответа API. Вероятно, запрос был заблокирован по соображениям безопасности. Попробуйте изменить запрос.");

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        if (error instanceof Error) {
            throw error; // Re-throw errors with specific messages
        }
        throw new Error("Произошла непредвиденная ошибка при генерации изображения.");
    }
};