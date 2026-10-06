import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  ShoppingBag,
  RefreshCw,
  Shuffle,
  ChefHat,
  Flame,
  Globe2,
} from 'lucide-react';
import { MealDBRecipe } from '../types';

interface StreamMealRecommendationProps {
  fridgeIngredients: string[];
  onSelectRecipe: (recipe: MealDBRecipe) => void;
  onViewAllStreamRecipes: () => void;
}

export const StreamMealRecommendation: React.FC<StreamMealRecommendationProps> = ({
  fridgeIngredients,
  onSelectRecipe,
  onViewAllStreamRecipes,
}) => {
  const [streamMeals, setStreamMeals] = useState<MealDBRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Determine key protein/ingredient from user selection
  const activeFocusIngredient = useMemo(() => {
    const hasChicken = fridgeIngredients.some((f) => f.toLowerCase().includes('chicken'));
    if (hasChicken) return 'chicken_breast';
    const hasBeef = fridgeIngredients.some((f) => f.toLowerCase().includes('beef'));
    if (hasBeef) return 'beef';
    const hasSalmon = fridgeIngredients.some((f) => f.toLowerCase().includes('salmon') || f.toLowerCase().includes('fish'));
    if (hasSalmon) return 'salmon';
    const hasEgg = fridgeIngredients.some((f) => f.toLowerCase().includes('egg'));
    if (hasEgg) return 'egg';
    return 'chicken_breast'; // Default endpoint from brief
  }, [fridgeIngredients]);

  // Fetch data stream from /api/food_selection with fallback to TheMealDB
  useEffect(() => {
    let isMounted = true;
    async function fetchStream() {
      setLoading(true);
      try {
        let res = await fetch(`/api/food_selection?i=${encodeURIComponent(activeFocusIngredient)}`);
        if (!res.ok) {
          res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(activeFocusIngredient)}`);
        }
        if (res.ok) {
          const data = await res.json();
          const meals = Array.isArray(data.meals) ? data.meals : [];
          if (isMounted) {
            setStreamMeals(meals);
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        console.error('Error fetching stream recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStream();
    return () => {
      isMounted = false;
    };
  }, [activeFocusIngredient]);

  // Rank meals based on user fridge selection
  const rankedMeals = useMemo(() => {
    if (streamMeals.length === 0) return [];
    
    // Sort meals: prioritize meals whose titles or ingredients match user's fridge items (garlic, curry, salad, rice, cheese, etc.)
    return [...streamMeals].sort((a, b) => {
      const aMatches = fridgeIngredients.filter((ing) =>
        a.strMeal.toLowerCase().includes(ing.toLowerCase().split(' ')[0])
      ).length;
      const bMatches = fridgeIngredients.filter((ing) =>
        b.strMeal.toLowerCase().includes(ing.toLowerCase().split(' ')[0])
      ).length;
      return bMatches - aMatches;
    });
  }, [streamMeals, fridgeIngredients]);

  const recommendedMeal = rankedMeals[currentIndex % (rankedMeals.length || 1)];

  const handleNextMeal = () => {
    if (rankedMeals.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % rankedMeals.length);
    }
  };

  const hasCoreIngredientInFridge = useMemo(() => {
    return fridgeIngredients.some((f) => {
      const lower = f.toLowerCase();
      return (
        lower.includes('chicken') ||
        lower.includes('breast') ||
        lower.includes(activeFocusIngredient.replace('_', ' '))
      );
    });
  }, [fridgeIngredients, activeFocusIngredient]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-md flex items-center justify-center space-x-3 text-stone-500">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-sm font-semibold">
          Matching your fridge selection with TheMealDB stream...
        </span>
      </div>
    );
  }

  if (!recommendedMeal) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-lg shadow-amber-500/5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Stream Match for Your Fridge
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Based on {fridgeIngredients.length} ingredients selected
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-1">
            Recommended Dish from TheMealDB Data Stream
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Peeled directly from the live{' '}
            <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
              filter.php?i={activeFocusIngredient}
            </span>{' '}
            stream.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleNextMeal}
            className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Shuffle to another recommended dish from the stream"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-600" />
            <span>Shuffle Recipe</span>
          </button>
          <button
            onClick={onViewAllStreamRecipes}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white flex items-center space-x-1 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-orange-400 mr-1" />
            <span>Browse All {streamMeals.length}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Featured Meal Showcase */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-md flex flex-col md:flex-row items-stretch">
        {/* Photo Cover */}
        <div className="relative md:w-5/12 h-64 md:h-auto min-h-[240px] bg-stone-950 overflow-hidden shrink-0">
          <img
            src={recommendedMeal.strMealThumb}
            alt={recommendedMeal.strMeal}
            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-stone-950/80 via-transparent to-transparent" />

          {/* Badge over photo */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
              {recommendedMeal.strArea && recommendedMeal.strArea !== 'null'
                ? recommendedMeal.strArea
                : 'International'}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500 text-white shadow-xs">
              {hasCoreIngredientInFridge ? '✓ In Your Fridge' : '🛒 Core Protein Needed'}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 md:hidden">
            <h4 className="text-xl font-black text-white leading-tight drop-shadow-md">
              {recommendedMeal.strMeal}
            </h4>
          </div>
        </div>

        {/* Details & Recommendation Body */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="hidden md:flex items-center space-x-2 text-xs text-stone-500 mb-1">
              <span>TheMealDB Record #{recommendedMeal.idMeal}</span>
              <span>•</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Top recommendation for your ingredients
              </span>
            </div>

            <h4 className="hidden md:block text-2xl font-black text-stone-900 dark:text-white leading-tight">
              {recommendedMeal.strMeal}
            </h4>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
              Based on your selection of{' '}
              <strong className="text-stone-900 dark:text-white font-semibold">
                {fridgeIngredients.slice(0, 4).join(', ')}
                {fridgeIngredients.length > 4 ? ` (+${fridgeIngredients.length - 4} more)` : ''}
              </strong>
              , this dish transforms your on-hand ingredients into an authentic restaurant-quality meal.
            </p>

            {/* Ingredients status pill bar */}
            <div className="mt-4 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {hasCoreIngredientInFridge
                    ? 'Chicken Breast available in your fridge'
                    : 'Add Chicken Breast to complete dish'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Stream Result {((currentIndex % rankedMeals.length) + 1)} of {rankedMeals.length}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-stone-500 flex items-center self-start sm:self-auto">
              <ChefHat className="w-4 h-4 text-amber-600 mr-1.5" />
              Includes store &amp; aisle scouting for any missing spices
            </span>

            <button
              onClick={() => onSelectRecipe(recommendedMeal)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white flex items-center justify-center space-x-2 shadow-md shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Cook This Recipe &amp; Scout Stores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
