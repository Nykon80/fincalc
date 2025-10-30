
export interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  calories: number;
  cookTime: number; // in minutes
}

export interface StyleSettings {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardBackgroundColor: string;
  headingColor: string;
}
