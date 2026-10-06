import React from 'react';
import {
  Clock,
  Users,
  ChefHat,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  Plus,
  Compass,
} from 'lucide-react';
import { CuisineRecipe, QuickFridgeMeal, MissingIngredientDetail } from '../types';

interface RecipeCardProps {
  recipe: CuisineRecipe | QuickFridgeMeal;
  type: 'cuisine' | 'fridge-quick';
  onViewDetails: (recipe: any) => void;
  onAddMissingToShoppingList?: (items: MissingIngredientDetail[]) => void;
}

const STORE_CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Asian Market': {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  Supermarket: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'Latin Grocer': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'Italian Deli': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  'Indian Grocer': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  'Whole Foods / Organic': {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  'Specialty Shop': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  'General Store': {
    bg: 'bg-stone-50 dark:bg-stone-800/40',
    text: 'text-stone-800 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-700',
  },
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  type,
  onViewDetails,
  onAddMissingToShoppingList,
}) => {
  const isCuisine = type === 'cuisine';
  const cuisineRecipe = isCuisine ? (recipe as CuisineRecipe) : null;
  const fridgeMeal = !isCuisine ? (recipe as QuickFridgeMeal) : null;

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-lg shadow-stone-200/40 dark:shadow-none hover:shadow-xl hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Card Body */}
      <div className="p-6">
        {/* Badges / Header info */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {isCuisine ? cuisineRecipe?.nativeName || 'Authentic Dish' : fridgeMeal?.cuisine || 'Quick Fridge Meal'}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              • {recipe.difficulty}
            </span>
          </div>

          {/* Time & Servings */}
          <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" />
              {totalTime}m
            </span>
            <span className="flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-stone-400" />
              {recipe.servings}
            </span>
          </div>
        </div>

        {/* Recipe Title & Description */}
        <h3 className="text-xl font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {recipe.title}
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

        {/* Fridge vs Missing Ingredients Section */}
        <div className="mt-5 space-y-3">
          {/* 1. Already In Fridge */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                From Your Fridge ({isCuisine ? cuisineRecipe?.ingredientsAlreadyHave.length : fridgeMeal?.matchingIngredients.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(isCuisine ? cuisineRecipe?.ingredientsAlreadyHave : fridgeMeal?.matchingIngredients)?.map(
                (item, i) => (
                  <span
                    key={`${item}-${i}`}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                  >
                    ✓ {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 2. Missing Ingredients & Store Advice (Cuisine Mode) */}
          {isCuisine && cuisineRecipe?.missingIngredients && cuisineRecipe.missingIngredients.length > 0 && (
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                <span className="flex items-center text-amber-700 dark:text-amber-400">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                  Missing to Buy ({cuisineRecipe.missingIngredients.length} items)
                </span>
                {cuisineRecipe.estimatedTopUpCost && (
                  <span className="text-stone-500 font-semibold text-[10px]">
                    Est. {cuisineRecipe.estimatedTopUpCost}
                  </span>
                )}
              </div>

              {/* Missing list preview */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {cuisineRecipe.missingIngredients.map((item, idx) => {
                  const style =
                    STORE_CATEGORY_STYLES[item.storeCategoryBadge] ||
                    STORE_CATEGORY_STYLES['Supermarket'];
                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center space-x-1">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-stone-500 font-normal">
                            ({item.quantity})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <Store className="w-2.5 h-2.5 inline mr-0.5" />
                            {item.storeType}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                            {item.aisleOrSection}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                          {item.estimatedPrice}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing in fridge mode */}
          {!isCuisine && fridgeMeal?.missingOrOptionalIngredients && fridgeMeal.missingOrOptionalIngredients.length > 0 && (
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Optional Pantry Enhancements:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fridgeMeal.missingOrOptionalIngredients.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                  >
                    + {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 sm:p-5 bg-stone-50/70 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
        {isCuisine && onAddMissingToShoppingList && cuisineRecipe?.missingIngredients ? (
          <button
            onClick={() => onAddMissingToShoppingList(cuisineRecipe.missingIngredients)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center space-x-1"
            title="Add missing items to your master store list"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Missing</span>
            <span className="sm:hidden">Shop</span>
          </button>
        ) : (
          <div className="text-[11px] text-stone-500 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            <span>Ready with your fridge!</span>
          </div>
        )}

        <button
          onClick={() => onViewDetails(recipe)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-amber-600 dark:bg-white dark:text-stone-900 dark:hover:bg-amber-400 text-white transition-all flex items-center space-x-1.5 shadow-sm group-hover:scale-105"
        >
          <span>Step-by-Step Cooking</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
