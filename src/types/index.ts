export type IngredientCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Meat & Poultry'
  | 'Seafood'
  | 'Grains & Pasta'
  | 'Pantry & Spices'
  | 'Condiments & Sauces'
  | 'Leftovers & Prepared'
  | 'Beverages'
  | 'Other';

export interface DetectedIngredient {
  name: string;
  category: IngredientCategory;
  estimatedState?: string;
  isExpiringSoon?: boolean;
  notes?: string;
}

export type StoreCategoryBadge =
  | 'Asian Market'
  | 'Supermarket'
  | 'Latin Grocer'
  | 'Italian Deli'
  | 'Indian Grocer'
  | 'Whole Foods / Organic'
  | 'Specialty Shop'
  | 'General Store';

export interface MissingIngredientDetail {
  name: string;
  quantity: string;
  storeType: string;
  storeCategoryBadge: StoreCategoryBadge;
  aisleOrSection: string;
  estimatedPrice: string;
  quickSubstitute: string;
  purchased?: boolean;
}

export interface RecipeInstructionStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
  timerMinutes?: number;
}

export interface NutritionEstimate {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface CuisineRecipe {
  id: string;
  title: string;
  nativeName?: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  servings: number;
  estimatedTopUpCost?: string;
  ingredientsAlreadyHave: string[];
  missingIngredients: MissingIngredientDetail[];
  instructions: RecipeInstructionStep[];
  chefSecret?: string;
  suggestedPairing?: string;
  nutritionEstimate?: NutritionEstimate;
}

export interface QuickFridgeMeal {
  id: string;
  title: string;
  cuisine: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  servings: number;
  matchScorePercent: number;
  matchingIngredients: string[];
  missingOrOptionalIngredients: string[];
  whyItWorks: string;
  nutritionSummary: string;
  instructions: string[];
  chefTip: string;
}

export interface ConsolidatedStorePlan {
  storeType: string;
  storeCategoryBadge: StoreCategoryBadge;
  items: {
    name: string;
    usedInRecipes: string[];
    aisle: string;
    estimatedPrice: string;
    checked?: boolean;
  }[];
}

export interface CuisinePlanResponse {
  cuisine: string;
  cuisineStory: string;
  recipes: CuisineRecipe[];
  consolidatedShoppingPlan: ConsolidatedStorePlan[];
}

export interface FridgeAuditResponse {
  detectedIngredients: DetectedIngredient[];
  chefSummary: string;
  meals: QuickFridgeMeal[];
}

export interface IngredientScoutResult {
  ingredient: string;
  bestStores: string[];
  aisleLocation: string;
  selectionTips: string;
  substitutes: {
    name: string;
    ratio: string;
    notes: string;
  }[];
  typicalPrice: string;
}
