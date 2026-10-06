import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Users,
  ChefHat,
  ShoppingBag,
  Store,
  CheckCircle2,
  Sparkles,
  Youtube,
  ExternalLink,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MealDBRecipe, MissingIngredientDetail } from '../types';

interface MealDbRecipeModalProps {
  recipe: MealDBRecipe;
  onClose: () => void;
  onAddMissingToShoppingList: (items: MissingIngredientDetail[]) => void;
  fridgeIngredients: string[];
}

export const MealDbRecipeModal: React.FC<MealDbRecipeModalProps> = ({
  recipe,
  onClose,
  onAddMissingToShoppingList,
  fridgeIngredients,
}) => {

  const [loadingScout, setLoadingScout] = useState(false);
  const [scoutedData, setScoutedData] = useState<{
    ingredientsAlreadyHave: string[];
    missingIngredients: MissingIngredientDetail[];
    chefTip?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    difficulty?: string;
    estimatedTopUpCost?: string;
  } | null>(null);

  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Active cooking timer
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>('');

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && activeTimerSeconds !== null && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (activeTimerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerSeconds]);

  const [fullRecipe, setFullRecipe] = useState<MealDBRecipe>(recipe);

  // If the recipe is from the raw filter stream without full details, fetch details
  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      if (recipe.ingredients && recipe.ingredients.length > 0 && recipe.strInstructions) {
        setFullRecipe(recipe);
        return;
      }
      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
        if (res.ok) {
          const data = await res.json();
          const raw = data.meals?.[0];
          if (raw && isMounted) {
            const ingredients: any[] = [];
            for (let i = 1; i <= 20; i++) {
              const ing = raw[`strIngredient${i}`];
              const measure = raw[`strMeasure${i}`];
              if (ing && ing.trim()) {
                ingredients.push({ name: ing.trim(), measure: (measure || '').trim() });
              }
            }
            setFullRecipe({
              idMeal: raw.idMeal,
              strMeal: raw.strMeal,
              strCategory: raw.strCategory || 'Chicken',
              strArea: raw.strArea || 'International',
              strInstructions: raw.strInstructions || '',
              strMealThumb: raw.strMealThumb || recipe.strMealThumb,
              strYoutube: raw.strYoutube || '',
              strSource: raw.strSource || '',
              ingredients,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch lookup for meal:', err);
      }
    }
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [recipe.idMeal]);

  // Automatically trigger store scout on mount for this recipe
  useEffect(() => {
    let isMounted = true;
    async function scoutStores() {
      setLoadingScout(true);
      try {
        const res = await fetch('/api/mealdb/scout-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meal: fullRecipe,
            fridgeIngredients,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setScoutedData(data);
        }
      } catch (err) {
        console.error('Failed to scout recipe stores:', err);
      } finally {
        if (isMounted) setLoadingScout(false);
      }
    }
    scoutStores();
    return () => {
      isMounted = false;
    };
  }, [fullRecipe.idMeal, fullRecipe.ingredients?.length]);

  // Split raw instructions into steps
  const steps = fullRecipe.strInstructions
    ? fullRecipe.strInstructions
        .split(/\r?\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
    : [];

  const handleCopy = () => {
    const text = `
🍳 ${fullRecipe.strMeal} (${fullRecipe.strArea || 'International'} Cuisine - TheMealDB)
${fullRecipe.strMealThumb}

📋 INGREDIENTS:
${(fullRecipe.ingredients || []).map((i) => `• ${i.name}: ${i.measure}`).join('\n')}

👨‍🍳 INSTRUCTIONS:
${fullRecipe.strInstructions}

${fullRecipe.strYoutube ? `📺 Video: ${fullRecipe.strYoutube}` : ''}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      if (Object.values(next).filter(Boolean).length === steps.length) {
        try {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        } catch (e) {}
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header with Photo Thumbnail */}
        <div className="relative h-48 sm:h-64 bg-stone-900 overflow-hidden shrink-0">
          <img
            src={recipe.strMealThumb}
            alt={recipe.strMeal}
            className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-black/30" />

          {/* Action buttons on top */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {recipe.strYoutube && (
              <a
                href={recipe.strYoutube}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-sm"
              >
                <Youtube className="w-4 h-4" />
                <span className="hidden sm:inline">Watch Tutorial</span>
              </a>
            )}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
              title="Copy recipe"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & tags on bottom of banner */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                {fullRecipe.strArea || 'International'} Cuisine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                TheMealDB #{fullRecipe.idMeal}
              </span>
              {scoutedData?.estimatedTopUpCost && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/90 text-white">
                  Est. Top-up: {scoutedData.estimatedTopUpCost}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
              {fullRecipe.strMeal}
            </h2>
          </div>
        </div>

        {/* Floating Timer Bar */}
        {activeTimerSeconds !== null && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 flex items-center justify-between text-xs sm:text-sm shadow-inner shrink-0">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-semibold">Timer: {timerLabel}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-base font-bold tracking-wider">
                {Math.floor(activeTimerSeconds / 60)}:
                {(activeTimerSeconds % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 rounded-md bg-white/20 hover:bg-white/30"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setActiveTimerSeconds(null);
                  setTimerRunning(false);
                }}
                className="p-1 rounded-md bg-white/20 hover:bg-white/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Prep Time</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {scoutedData?.prepTimeMinutes || 15} mins
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cook Time</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {scoutedData?.cookTimeMinutes || 25} mins
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Difficulty</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {scoutedData?.difficulty || 'Medium'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ingredients</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {fullRecipe.ingredients?.length || 0} items
              </div>
            </div>
          </div>

          {/* DUAL SECTION: In-Fridge vs Store Scout for Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Recipe Ingredients & On-Hand Status */}
            <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center mb-3">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Recipe Ingredients ({fullRecipe.ingredients?.length || 0})
              </span>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {(fullRecipe.ingredients || []).map((ing, i) => {
                  const inFridge = fridgeIngredients.some(
                    (f) =>
                      f.toLowerCase().includes(ing.name.toLowerCase()) ||
                      ing.name.toLowerCase().includes(f.toLowerCase())
                  );
                  return (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded-xl flex items-center justify-between border ${
                        inFridge
                          ? 'bg-white dark:bg-stone-800 border-emerald-200 dark:border-emerald-800 text-stone-900 dark:text-white font-semibold'
                          : 'bg-white/60 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={inFridge ? 'text-emerald-600' : 'text-stone-400'}>
                          {inFridge ? '✓' : '•'}
                        </span>
                        <span>{ing.name}</span>
                        {inFridge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                            in fridge
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-normal">
                        {ing.measure}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Missing Ingredients & Where to Buy (Store Guide) */}
            <div className="border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1.5 text-amber-600" />
                  Store &amp; Aisle Scout ({scoutedData?.missingIngredients?.length || 0})
                </span>
                {scoutedData?.missingIngredients && scoutedData.missingIngredients.length > 0 && (
                  <button
                    onClick={() => onAddMissingToShoppingList(scoutedData.missingIngredients)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add all to list</span>
                  </button>
                )}
              </div>

              {loadingScout ? (
                <div className="py-12 text-center text-stone-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                  <p className="text-xs font-medium">Scouting store aisles &amp; substitutes...</p>
                </div>
              ) : scoutedData?.missingIngredients && scoutedData.missingIngredients.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scoutedData.missingIngredients.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-stone-900 dark:text-white">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-stone-500 ml-1.5">
                            ({item.quantity})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {item.estimatedPrice}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 flex items-center">
                          <Store className="w-2.5 h-2.5 mr-1" />
                          {item.storeType}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          📍 {item.aisleOrSection}
                        </span>
                      </div>

                      {item.quickSubstitute && (
                        <div className="mt-1.5 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/60 p-1.5 rounded-lg border border-stone-100 dark:border-stone-800">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            💡 Substitute hack:{' '}
                          </span>
                          {item.quickSubstitute}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  🎉 You have all the main ingredients in your fridge!
                </div>
              )}
            </div>
          </div>

          {/* CHEF TIP */}
          {scoutedData?.chefTip && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    Chef Pro-Tip for this Dish
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                    {scoutedData.chefTip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP BY STEP INSTRUCTIONS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-amber-600" />
                Authentic Cooking Instructions
              </h3>
              <span className="text-xs text-stone-400">Check off as you cook</span>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isDone = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isDone
                        ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 opacity-75'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed ${
                            isDone ? 'line-through text-stone-400 dark:text-stone-500' : ''
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between">
          <button
            onClick={() => {
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Finished Cooking? Celebrate! 🎉</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white transition-all shadow-sm"
          >
            Close Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
