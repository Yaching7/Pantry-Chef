import React, { useState } from 'react';
import {
  X,
  Clock,
  Users,
  ChefHat,
  ShoppingBag,
  Store,
  CheckCircle2,
  Sparkles,
  Flame,
  Wine,
  HelpCircle,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CuisineRecipe, QuickFridgeMeal, MissingIngredientDetail } from '../types';

interface RecipeDetailModalProps {
  recipe: CuisineRecipe | QuickFridgeMeal | null;
  onClose: () => void;
  onAddMissingToShoppingList?: (items: MissingIngredientDetail[]) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onAddMissingToShoppingList,
}) => {
  if (!recipe) return null;

  const isCuisine = 'missingIngredients' in recipe;
  const cuisineRecipe = isCuisine ? (recipe as CuisineRecipe) : null;
  const fridgeMeal = !isCuisine ? (recipe as QuickFridgeMeal) : null;

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  // Active cooking timer state
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>('');

  React.useEffect(() => {
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

  const startTimer = (minutes: number, label: string) => {
    setActiveTimerSeconds(minutes * 60);
    setTimerLabel(label);
    setTimerRunning(true);
  };

  const toggleStep = (stepIdx: number) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepIdx]: !prev[stepIdx] };
      const totalSteps = isCuisine
        ? cuisineRecipe?.instructions.length || 0
        : fridgeMeal?.instructions.length || 0;
      const doneCount = Object.values(next).filter(Boolean).length;
      if (doneCount === totalSteps) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch (e) {}
      }
      return next;
    });
  };

  const handleCopyRecipe = () => {
    const text = `
🍳 ${recipe.title}
${isCuisine && cuisineRecipe?.nativeName ? `(${cuisineRecipe.nativeName})` : ''}
${recipe.description}

⏱️ Prep: ${recipe.prepTimeMinutes} mins | Cook: ${recipe.cookTimeMinutes} mins | Servings: ${recipe.servings}

📋 INGREDIENTS FROM FRIDGE:
${(isCuisine ? cuisineRecipe?.ingredientsAlreadyHave : fridgeMeal?.matchingIngredients)
  ?.map((i) => `• ${i}`)
  .join('\n')}

${
  isCuisine && cuisineRecipe?.missingIngredients?.length
    ? `🛒 MISSING INGREDIENTS TO BUY:\n` +
      cuisineRecipe.missingIngredients
        .map((m) => `• ${m.name} (${m.quantity}) - Buy at: ${m.storeType} [${m.aisleOrSection}] ~${m.estimatedPrice}`)
        .join('\n')
    : ''
}

👨‍🍳 COOKING METHOD:
${
  isCuisine
    ? cuisineRecipe?.instructions.map((ins) => `${ins.stepNumber}. ${ins.title}: ${ins.instruction}`).join('\n\n')
    : fridgeMeal?.instructions.map((ins, i) => `${i + 1}. ${ins}`).join('\n\n')
}

✨ CHEF PRO-TIP:
${isCuisine ? cuisineRecipe?.chefSecret : fridgeMeal?.chefTip}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-md">
          <div className="min-w-0 pr-4">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                {isCuisine ? cuisineRecipe?.nativeName || 'Authentic Dish' : fridgeMeal?.cuisine || 'Quick Fridge Meal'}
              </span>
              <span className="text-xs text-stone-500 font-semibold">• {recipe.difficulty}</span>
              {isCuisine && cuisineRecipe?.estimatedTopUpCost && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Est. Store Top-up: {cuisineRecipe.estimatedTopUpCost}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white mt-1.5 leading-tight">
              {recipe.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              {recipe.description}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyRecipe}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors text-xs font-semibold flex items-center space-x-1"
              title="Copy recipe text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Timer Bar if active */}
        {activeTimerSeconds !== null && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 flex items-center justify-between text-xs sm:text-sm shadow-inner">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-semibold">Cooking Timer: {timerLabel}</span>
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

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Prep Time</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {recipe.prepTimeMinutes} mins
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cook Time</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {recipe.cookTimeMinutes} mins
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Servings</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {recipe.servings} portions
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Difficulty</div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {recipe.difficulty}
              </div>
            </div>
          </div>

          {/* INGREDIENTS DUAL SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Already in your fridge */}
            <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  In Your Fridge
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Ready to use
                </span>
              </div>
              <ul className="space-y-1.5">
                {(isCuisine ? cuisineRecipe?.ingredientsAlreadyHave : fridgeMeal?.matchingIngredients)?.map(
                  (item, i) => (
                    <li
                      key={i}
                      className="text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center space-x-2 bg-white/80 dark:bg-stone-800/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Right: Missing Ingredients & Where to Buy */}
            {isCuisine && cuisineRecipe?.missingIngredients && (
              <div className="border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-1.5 text-amber-600" />
                    Missing Ingredients ({cuisineRecipe.missingIngredients.length})
                  </span>
                  {onAddMissingToShoppingList && (
                    <button
                      onClick={() => onAddMissingToShoppingList(cuisineRecipe.missingIngredients)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add all to list</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {cuisineRecipe.missingIngredients.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-stone-900 dark:text-white">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-stone-500 ml-1.5">
                            ({item.quantity})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {item.estimatedPrice}
                        </span>
                      </div>

                      {/* Store & Aisle Information */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 flex items-center">
                          <Store className="w-2.5 h-2.5 mr-1" />
                          {item.storeType}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          📍 {item.aisleOrSection}
                        </span>
                      </div>

                      {/* Quick Substitute Hack */}
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
              </div>
            )}
          </div>

          {/* STEP BY STEP COOKING INSTRUCTIONS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-amber-600" />
                Step-by-Step Cooking Guide
              </h3>
              <span className="text-xs text-stone-400">
                Tap steps to check off as you cook
              </span>
            </div>

            <div className="space-y-3">
              {isCuisine && cuisineRecipe?.instructions ? (
                cuisineRecipe.instructions.map((step, idx) => {
                  const isDone = !!completedSteps[idx];
                  return (
                    <div
                      key={step.stepNumber || idx}
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
                          {isDone ? '✓' : step.stepNumber || idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-stone-900 dark:text-white flex items-center justify-between">
                            <span className={isDone ? 'line-through text-stone-400' : ''}>
                              {step.title}
                            </span>
                            {/* Suggested timer button if instruction mentions minutes */}
                            {/\b(\d+)\s*(?:minutes?|mins?)\b/i.test(step.instruction) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const match = step.instruction.match(/\b(\d+)\s*(?:minutes?|mins?)\b/i);
                                  const mins = match ? parseInt(match[1], 10) : 5;
                                  startTimer(mins, step.title);
                                }}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center space-x-1"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Set Timer</span>
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-1 leading-relaxed ${
                              isDone ? 'line-through text-stone-400 dark:text-stone-500' : ''
                            }`}
                          >
                            {step.instruction}
                          </p>
                          {step.tip && (
                            <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                              ✨ Pro-tip: {step.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                fridgeMeal?.instructions.map((inst, idx) => {
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
                              isDone ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {inst}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHEF SECRET PRO-TIP */}
          {(cuisineRecipe?.chefSecret || fridgeMeal?.chefTip) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    Chef's Golden Rule for this Dish
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                    {cuisineRecipe?.chefSecret || fridgeMeal?.chefTip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAIRING & NUTRITION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cuisineRecipe?.suggestedPairing && (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex items-start space-x-3">
                <Wine className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-stone-500 uppercase tracking-wider">
                    Beverage &amp; Side Pairing
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                    {cuisineRecipe.suggestedPairing}
                  </p>
                </div>
              </div>
            )}

            {cuisineRecipe?.nutritionEstimate && (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="font-bold text-xs text-stone-500 uppercase tracking-wider mb-2">
                  Nutrition per Serving
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white dark:bg-stone-800 p-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Cal</span>
                    <span className="text-xs font-bold">{cuisineRecipe.nutritionEstimate.calories}</span>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Protein</span>
                    <span className="text-xs font-bold">{cuisineRecipe.nutritionEstimate.proteinGrams}g</span>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Carbs</span>
                    <span className="text-xs font-bold">{cuisineRecipe.nutritionEstimate.carbsGrams}g</span>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Fat</span>
                    <span className="text-xs font-bold">{cuisineRecipe.nutritionEstimate.fatGrams}g</span>
                  </div>
                </div>
              </div>
            )}
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
