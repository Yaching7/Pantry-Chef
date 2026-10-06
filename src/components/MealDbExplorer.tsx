import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Flame,
  Globe2,
  RefreshCw,
} from 'lucide-react';
import { MealDBRecipe } from '../types';

interface MealDbExplorerProps {
  fridgeIngredients: string[];
  onSelectRecipe: (recipe: MealDBRecipe) => void;
  onOpenShoppingList: () => void;
}

const COMMON_FILTER_INGREDIENTS = [
  { label: '🍗 Chicken Breast (Default)', value: 'chicken_breast' },
  { label: '🥩 Beef', value: 'beef' },
  { label: '🐟 Salmon', value: 'salmon' },
  { label: '🥓 Pork', value: 'pork' },
  { label: '🥚 Eggs', value: 'egg' },
  { label: '🥔 Potatoes', value: 'potato' },
];

export const MealDbExplorer: React.FC<MealDbExplorerProps> = ({
  fridgeIngredients,
  onSelectRecipe,
  onOpenShoppingList,
}) => {
  const [selectedIngredient, setSelectedIngredient] = useState('chicken_breast');
  const [recipes, setRecipes] = useState<MealDBRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');

  // Load recipes from our database endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadDatabase() {
      setLoading(true);
      try {
        const res = await fetch(`/api/mealdb/recipes?ingredient=${encodeURIComponent(selectedIngredient)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRecipes(data.meals || []);
          }
        }
      } catch (err) {
        console.error('Failed to load TheMealDB database:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDatabase();
    return () => {
      isMounted = false;
    };
  }, [selectedIngredient]);

  // Extract unique areas
  const areas = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => {
      if (r.strArea && r.strArea !== 'null') set.add(r.strArea);
    });
    return ['All', ...Array.from(set).sort()];
  }, [recipes]);

  // Compute fridge match score for each recipe
  const enrichedRecipes = useMemo(() => {
    return recipes.map((recipe) => {
      let matchedCount = 0;
      const inFridge: string[] = [];
      const missing: string[] = [];

      recipe.ingredients.forEach((ing) => {
        const hasMatch = fridgeIngredients.some(
          (f) =>
            f.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(f.toLowerCase())
        );
        if (hasMatch) {
          matchedCount++;
          inFridge.push(ing.name);
        } else {
          missing.push(ing.name);
        }
      });

      const total = recipe.ingredients.length || 1;
      const score = Math.round((matchedCount / total) * 100);

      return {
        ...recipe,
        matchScorePercent: score,
        inFridgeIngredients: inFridge,
        missingIngredients: missing,
      };
    });
  }, [recipes, fridgeIngredients]);

  // Filter recipes by search query and area
  const filteredRecipes = useMemo(() => {
    return enrichedRecipes.filter((r) => {
      const matchQuery =
        !searchQuery ||
        r.strMeal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchArea = selectedArea === 'All' || r.strArea === selectedArea;
      return matchQuery && matchArea;
    });
  }, [enrichedRecipes, searchQuery, selectedArea]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm flex items-center">
                <Database className="w-3.5 h-3.5 mr-1.5" />
                TheMealDB Curated Database
              </span>
              <span className="text-xs text-white/80">• Real Verified Recipes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
              Chicken Breast Recipe Database &amp; Store Scout
            </h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
              Real world recipes fetched from TheMealDB endpoint. Each dish is cross-matched with your fridge, and our AI scouts the exact stores &amp; aisles for every missing item!
            </p>
          </div>

          {/* Quick Ingredient Switcher */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold text-white/80 block mb-1">
              TheMealDB Filter Endpoint:
            </span>
            <select
              value={selectedIngredient}
              onChange={(e) => setSelectedIngredient(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold focus:outline-none"
            >
              {COMMON_FILTER_INGREDIENTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search & Area Filter Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes or ingredients in database (e.g. curry, salad, garlic, pasta)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Cuisine Area Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 pr-1">
          <span className="text-xs font-bold text-stone-400 shrink-0 mr-1 flex items-center">
            <Globe2 className="w-3.5 h-3.5 mr-1" />
            Cuisine:
          </span>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedArea === area
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
          <p className="text-sm font-semibold">
            Querying TheMealDB endpoint &amp; calculating fridge match scores...
          </p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-500">
          <p className="text-sm font-semibold">No recipes found matching your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedArea('All');
            }}
            className="mt-2 text-xs font-bold text-amber-600 hover:underline"
          >
            Reset search filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const hasHighMatch = (recipe.matchScorePercent || 0) >= 50;
            return (
              <div
                key={recipe.idMeal}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group hover:border-amber-400/60"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-stone-950">
                    <img
                      src={recipe.strMealThumb}
                      alt={recipe.strMeal}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                    {/* Area Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {recipe.strArea || 'International'}
                      </span>
                    </div>

                    {/* Match Score Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-md backdrop-blur-md ${
                          hasHighMatch
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}
                      >
                        {recipe.matchScorePercent}% Fridge Match
                      </span>
                    </div>

                    {/* Dish Title on bottom of photo */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-black text-white leading-tight drop-shadow-sm truncate">
                        {recipe.strMeal}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    {/* Ingredients summary */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {recipe.inFridgeIngredients?.length || 0} in fridge
                      </span>
                      <span className="text-stone-500 flex items-center">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        {recipe.missingIngredients?.length || 0} to buy
                      </span>
                    </div>

                    {/* Key Ingredients tags */}
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                      {recipe.ingredients.slice(0, 5).map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                        >
                          {ing.name}
                        </span>
                      ))}
                      {recipe.ingredients.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-stone-400">
                          +{recipe.ingredients.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    TheMealDB #{recipe.idMeal}
                  </span>
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-sm group-hover:scale-105 transition-all"
                  >
                    <span>Store Scout &amp; Cook</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
