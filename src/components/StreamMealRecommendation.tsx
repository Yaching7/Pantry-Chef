import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  ShoppingBag,
  RefreshCw,
  ChefHat,
  Filter,
  Check,
  Plus,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { MealDBRecipe } from '../types';

interface StreamMealRecommendationProps {
  fridgeIngredients: string[];
  onSelectRecipe: (recipe: MealDBRecipe) => void;
  onViewAllStreamRecipes: () => void;
  onAddMissingToShoppingList?: (items: string[], recipeTitle: string) => void;
}

interface AuditedMeal extends Omit<MealDBRecipe, 'missingIngredients' | 'inFridgeIngredients'> {
  matchedIngredients: { name: string; measure?: string }[];
  missingIngredients: { name: string; measure?: string }[];
  inFridgeIngredients?: string[];
  matchPercent: number;
  isProposed: boolean;
}

// Common kitchen staples that home cooks often have or can quickly count as available if desired
const COMMON_PANTRY_STAPLES = new Set([
  'water',
  'salt',
  'black pepper',
  'pepper',
  'cooking oil',
  'vegetable oil',
  'olive oil',
  'sugar',
]);

/**
 * Flexible ingredient matching between recipe ingredient name and fridge items
 */
function isIngredientMatch(recipeIng: string, fridgeItem: string): boolean {
  const r = recipeIng.toLowerCase().trim();
  const f = fridgeItem.toLowerCase().trim();
  if (!r || !f) return false;
  if (r === f) return true;
  if (r.includes(f) || f.includes(r)) return true;

  // Word-stem matching (e.g. "chicken" matches "chicken breast" / "breasts")
  const rWords = r.split(/[\s,/-]+/).map((w) => w.replace(/(es|s)$/, ''));
  const fWords = f.split(/[\s,/-]+/).map((w) => w.replace(/(es|s)$/, ''));

  return rWords.some((rw) => rw.length > 2 && fWords.some((fw) => fw.length > 2 && (rw === fw || rw.startsWith(fw) || fw.startsWith(rw))));
}

export const StreamMealRecommendation: React.FC<StreamMealRecommendationProps> = ({
  fridgeIngredients,
  onSelectRecipe,
  onViewAllStreamRecipes,
  onAddMissingToShoppingList,
}) => {
  // Currently selected ingredient for streaming from endpoint
  const [selectedIngredient, setSelectedIngredient] = useState<string>('Chicken breast');
  const [streamMeals, setStreamMeals] = useState<MealDBRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [onlyProposed50, setOnlyProposed50] = useState<boolean>(true);
  const [addedRecipeMap, setAddedRecipeMap] = useState<Record<string, boolean>>({});

  // When fridgeIngredients changes, verify selected ingredient exists or pick the first available
  useEffect(() => {
    if (fridgeIngredients.length > 0) {
      const match = fridgeIngredients.find(
        (f) => f.toLowerCase() === selectedIngredient.toLowerCase()
      );
      if (!match) {
        // Pick primary protein or first ingredient
        const priority = fridgeIngredients.find((f) => {
          const l = f.toLowerCase();
          return l.includes('chicken') || l.includes('beef') || l.includes('egg') || l.includes('salmon');
        });
        setSelectedIngredient(priority || fridgeIngredients[0]);
      }
    }
  }, [fridgeIngredients]);

  // Normalize ingredient key for endpoint query (e.g. "Chicken breast" -> "chicken_breast")
  const queryParam = useMemo(() => {
    const raw = selectedIngredient || 'chicken_breast';
    const lower = raw.toLowerCase().trim();
    if (lower.includes('chicken')) return 'chicken_breast';
    if (lower.includes('beef')) return 'beef';
    if (lower.includes('salmon')) return 'salmon';
    if (lower.includes('egg')) return 'egg';
    return lower.replace(/\s+/g, '_');
  }, [selectedIngredient]);

  // Fetch data stream from /api/food_selection
  useEffect(() => {
    let isMounted = true;
    async function fetchStream() {
      setLoading(true);
      try {
        let res = await fetch(`/api/food_selection?i=${encodeURIComponent(queryParam)}&enrich=true`);
        if (!res.ok) {
          res = await fetch(`/api/mealdb/recipes?ingredient=${encodeURIComponent(queryParam)}`);
        }
        if (res.ok) {
          const data = await res.json();
          const meals = Array.isArray(data.meals) ? data.meals : [];
          if (isMounted) {
            setStreamMeals(meals);
          }
        }
      } catch (err) {
        console.error('Error fetching stream data from endpoint:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStream();
    return () => {
      isMounted = false;
    };
  }, [queryParam]);

  // Perform fridge audit on all streamed meals:
  // Calculate matched vs missing ingredients, match percent, and 50% proposal qualification
  const auditedMeals: AuditedMeal[] = useMemo(() => {
    return streamMeals.map((meal) => {
      const allIngredients = (meal.ingredients || []).filter((i) => i && i.name && i.name.trim());
      const matchedIngredients: { name: string; measure?: string }[] = [];
      const missingIngredients: { name: string; measure?: string }[] = [];

      allIngredients.forEach((ing) => {
        const isMatched =
          fridgeIngredients.some((fridgeItem) => isIngredientMatch(ing.name, fridgeItem)) ||
          COMMON_PANTRY_STAPLES.has(ing.name.toLowerCase().trim());

        if (isMatched) {
          matchedIngredients.push(ing);
        } else {
          missingIngredients.push(ing);
        }
      });

      const totalCount = allIngredients.length || 1;
      const matchPercent = Math.min(100, Math.round((matchedIngredients.length / totalCount) * 100));

      // User requirement: "no need to match all the ingredients. 50% of ingredients match, can propose and point out missing ingredients."
      const isProposed = matchPercent >= 50;

      return {
        ...meal,
        matchedIngredients,
        missingIngredients,
        matchPercent,
        isProposed,
      };
    });
  }, [streamMeals, fridgeIngredients]);

  // Sort meals: proposed meals (>= 50%) first, then by match percentage descending
  const sortedAuditedMeals = useMemo(() => {
    return [...auditedMeals].sort((a, b) => {
      if (a.isProposed !== b.isProposed) {
        return a.isProposed ? -1 : 1;
      }
      return b.matchPercent - a.matchPercent;
    });
  }, [auditedMeals]);

  // Filtered view based on the 50% match toggle
  const displayedMeals = useMemo(() => {
    if (onlyProposed50) {
      const proposed = sortedAuditedMeals.filter((m) => m.isProposed);
      // Fallback: if none are strictly >= 50%, show the top matches so the user still sees audit results
      return proposed.length > 0 ? proposed : sortedAuditedMeals.slice(0, 4);
    }
    return sortedAuditedMeals;
  }, [sortedAuditedMeals, onlyProposed50]);

  const proposedCount = sortedAuditedMeals.filter((m) => m.isProposed).length;
  const topProposedMeal = displayedMeals[0];

  const handleSelectAuditedRecipe = (m: AuditedMeal) => {
    onSelectRecipe({
      ...m,
      missingIngredients: m.missingIngredients.map((i) => i.name),
      inFridgeIngredients: m.matchedIngredients.map((i) => i.name),
    });
  };

  const handleAddMissingToCart = (meal: AuditedMeal) => {
    const missingNames = meal.missingIngredients.map((i) => i.name);
    if (missingNames.length > 0 && onAddMissingToShoppingList) {
      onAddMissingToShoppingList(missingNames, meal.strMeal);
      setAddedRecipeMap((prev) => ({ ...prev, [meal.idMeal]: true }));
      setTimeout(() => {
        setAddedRecipeMap((prev) => ({ ...prev, [meal.idMeal]: false }));
      }, 3000);
    }
  };

  return (
    <section className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-6">
      {/* SECTION HEADER & CONTEXT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Live Endpoint Data Stream
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Rule: ≥ 50% Fridge Match Proposes Dish
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-1.5">
            Audit Fridge &amp; Suggest Meals from Endpoint Stream
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
            Meals streamed directly from{' '}
            <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400 font-mono text-xs">
              /api/food_selection?i={queryParam}
            </code>
            . You don't need all ingredients—dishes with at least 50% match are proposed with missing items clearly pointed out!
          </p>
        </div>

        {/* Action button to explore full database */}
        <button
          onClick={onViewAllStreamRecipes}
          className="self-start lg:self-center px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white flex items-center space-x-1.5 transition-colors shadow-sm shrink-0"
        >
          <Database className="w-3.5 h-3.5 text-orange-400" />
          <span>Full Database Explorer</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* INTERACTIVE INGREDIENT SELECTION BAR */}
      <div className="bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center">
            <Filter className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            Select Fridge Ingredient to Stream &amp; Audit:
          </span>
          <span className="text-[11px] text-stone-500 font-medium">
            Active query: <strong className="text-amber-600 dark:text-amber-400">{selectedIngredient}</strong>
          </span>
        </div>

        {/* Clickable chips of user fridge ingredients */}
        <div className="flex flex-wrap gap-2">
          {fridgeIngredients.map((ing) => {
            const isSelected = ing.toLowerCase() === selectedIngredient.toLowerCase();
            return (
              <button
                key={ing}
                type="button"
                onClick={() => setSelectedIngredient(ing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'theme-btn-primary shadow-xs ring-2 ring-stone-400/20'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>{ing}</span>
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* AUDIT SUMMARY & 50% MATCH FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
            {proposedCount} Proposed Meals (≥ 50% Match)
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-500">
            {streamMeals.length} Total dishes in stream
          </span>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl self-start sm:self-auto border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setOnlyProposed50(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              onlyProposed50
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>≥ 50% Match Only ({proposedCount})</span>
          </button>
          <button
            onClick={() => setOnlyProposed50(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !onlyProposed50
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <span>Show All ({streamMeals.length})</span>
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-md flex items-center justify-center space-x-3 text-stone-500">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
          <span className="text-sm font-semibold">
            Auditing fridge against endpoint stream for "{selectedIngredient}"...
          </span>
        </div>
      )}

      {/* SPOTLIGHT FEATURED PROPOSED MEAL */}
      {!loading && topProposedMeal && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-amber-500/40 dark:border-amber-500/30 overflow-hidden shadow-lg flex flex-col lg:flex-row items-stretch">
          {/* Photo banner */}
          <div className="relative lg:w-5/12 h-64 lg:h-auto min-h-[260px] bg-stone-950 overflow-hidden shrink-0">
            <img
              src={topProposedMeal.strMealThumb}
              alt={topProposedMeal.strMeal}
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-950/85 via-stone-950/30 to-transparent" />

            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                {topProposedMeal.strArea || 'International'}
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-xs ${
                topProposedMeal.matchPercent >= 50
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {topProposedMeal.matchPercent}% Match {topProposedMeal.isProposed ? '• Proposed!' : ''}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 lg:hidden">
              <h4 className="text-xl font-black text-white leading-tight drop-shadow-md">
                {topProposedMeal.strMeal}
              </h4>
            </div>
          </div>

          {/* Details & Missing Ingredients Breakdown */}
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="hidden lg:flex items-center space-x-2 text-xs text-stone-500 mb-1">
                <span>Top Audited Match from Data Stream</span>
                <span>•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {topProposedMeal.matchedIngredients.length} of{' '}
                  {topProposedMeal.matchedIngredients.length + topProposedMeal.missingIngredients.length} ingredients ready in fridge
                </span>
              </div>

              <h4 className="hidden lg:block text-2xl font-black text-stone-900 dark:text-white leading-tight">
                {topProposedMeal.strMeal}
              </h4>

              {/* Match Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-stone-700 dark:text-stone-300">
                    Fridge Ingredient Match Score:
                  </span>
                  <span className={`font-mono text-xs ${
                    topProposedMeal.matchPercent >= 50 ? 'text-emerald-600 font-extrabold' : 'text-amber-600'
                  }`}>
                    {topProposedMeal.matchPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      topProposedMeal.matchPercent >= 50
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${topProposedMeal.matchPercent}%` }}
                  />
                </div>
              </div>

              {/* DUAL COLUMNS: IN YOUR FRIDGE vs MISSING INGREDIENTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {/* 1. In Your Fridge */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    In Your Fridge ({topProposedMeal.matchedIngredients.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {topProposedMeal.matchedIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800 text-stone-800 dark:text-stone-200"
                      >
                        ✓ {ing.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Point Out Missing Ingredients */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      Missing Ingredients ({topProposedMeal.missingIngredients.length})
                    </span>
                    {topProposedMeal.missingIngredients.length > 0 && onAddMissingToShoppingList && (
                      <button
                        onClick={() => handleAddMissingToCart(topProposedMeal)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center space-x-1"
                      >
                        {addedRecipeMap[topProposedMeal.idMeal] ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add to list</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {topProposedMeal.missingIngredients.length > 0 ? (
                      topProposedMeal.missingIngredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                        >
                          ⚠️ {ing.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-emerald-600">
                        🎉 All ingredients are already in your fridge!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-stone-500 flex items-center self-start sm:self-auto">
                <ChefHat className="w-4 h-4 text-amber-600 mr-1.5" />
                Includes step-by-step instructions &amp; store buying guides
              </span>

              <button
                onClick={() => handleSelectAuditedRecipe(topProposedMeal)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm theme-btn-primary flex items-center justify-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Cook Recipe &amp; Scout Stores</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDITIONAL PROPOSED MEALS GRID (≥ 50% MATCH) */}
      {!loading && displayedMeals.length > 1 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 text-amber-500 mr-1.5" />
              More Proposed Meals from Endpoint Stream
            </h4>
            <span className="text-xs text-stone-500">
              Showing {displayedMeals.length - 1} other suggestions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMeals.slice(1, 7).map((meal) => (
              <div
                key={meal.idMeal}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo header */}
                  <div className="relative h-40 bg-stone-950 overflow-hidden">
                    <img
                      src={meal.strMealThumb}
                      alt={meal.strMeal}
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {meal.strArea || 'International'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        meal.matchPercent >= 50
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {meal.matchPercent}% Match
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h5 className="text-sm font-bold text-white leading-tight drop-shadow-xs truncate">
                        {meal.strMeal}
                      </h5>
                    </div>
                  </div>

                  {/* Body with Pointed Out Missing Ingredients */}
                  <div className="p-4 space-y-3">
                    {/* Match status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-600 dark:text-stone-300">
                        {meal.matchedIngredients.length} in fridge
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {meal.missingIngredients.length} missing
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          meal.matchPercent >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${meal.matchPercent}%` }}
                      />
                    </div>

                    {/* Pointed out missing ingredients */}
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                      <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mr-1" />
                        Pointed Out Missing:
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {meal.missingIngredients.slice(0, 4).map((ing, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          >
                            {ing.name}
                          </span>
                        ))}
                        {meal.missingIngredients.length > 4 && (
                          <span className="text-[10px] text-stone-400 self-center">
                            +{meal.missingIngredients.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between gap-2">
                  {onAddMissingToShoppingList && meal.missingIngredients.length > 0 && (
                    <button
                      onClick={() => handleAddMissingToCart(meal)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-amber-400 text-stone-700 dark:text-stone-200 flex items-center space-x-1 transition-colors"
                      title="Add missing ingredients to shopping list"
                    >
                      {addedRecipeMap[meal.idMeal] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>
                        {addedRecipeMap[meal.idMeal] ? 'Added' : `+${meal.missingIngredients.length}`}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectAuditedRecipe(meal)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold theme-btn-primary flex items-center justify-center space-x-1 transition-all"
                  >
                    <span>View Recipe</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && displayedMeals.length === 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 text-center space-y-3">
          <Info className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-base font-bold text-stone-900 dark:text-white">
            No 50% Match Dishes for "{selectedIngredient}" Yet
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Try selecting another ingredient from your fridge above, or switch off the "≥ 50% Match Only" filter to see all dishes from the data stream!
          </p>
          <button
            onClick={() => setOnlyProposed50(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            Show All Stream Meals
          </button>
        </div>
      )}
    </section>
  );
};
