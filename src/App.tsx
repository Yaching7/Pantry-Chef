/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Refrigerator,
  Globe2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  ChefHat,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Check,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Header } from './components/Header';
import { FridgeInputSection } from './components/FridgeInputSection';
import { FridgeInventoryView } from './components/FridgeInventoryView';
import { CuisineSelector } from './components/CuisineSelector';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { ShoppingListModal } from './components/ShoppingListModal';
import { IngredientScoutModal } from './components/IngredientScoutModal';
import { MealDbExplorer } from './components/MealDbExplorer';
import { MealDbRecipeModal } from './components/MealDbRecipeModal';

import {
  DetectedIngredient,
  QuickFridgeMeal,
  CuisinePlanResponse,
  CuisineRecipe,
  MissingIngredientDetail,
  IngredientScoutResult,
  MealDBRecipe,
} from './types';

interface ShoppingItem extends MissingIngredientDetail {
  id: string;
  checked?: boolean;
}

export default function App() {
  // Navigation tab: 'fridge' | 'mealdb' | 'cuisine'
  const [activeTab, setActiveTab] = useState<'fridge' | 'mealdb' | 'cuisine'>('fridge');

  // Fridge state
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([
    'Eggs',
    'Butter',
    'Garlic',
    'Onion',
    'Soy sauce',
    'Spinach',
    'Chicken breast',
  ]);
  const [detectedDetails, setDetectedDetails] = useState<DetectedIngredient[]>([]);
  const [chefSummary, setChefSummary] = useState<string>('');
  const [quickMeals, setQuickMeals] = useState<QuickFridgeMeal[]>([]);

  // Cuisine state
  const [cuisinePlan, setCuisinePlan] = useState<CuisinePlanResponse | null>(null);

  // Shopping list state
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // Modals & Drawers
  const [selectedRecipe, setSelectedRecipe] = useState<CuisineRecipe | QuickFridgeMeal | null>(null);
  const [selectedMealDbRecipe, setSelectedMealDbRecipe] = useState<MealDBRecipe | null>(null);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState<boolean>(false);
  const [isIngredientScoutOpen, setIsIngredientScoutOpen] = useState<boolean>(false);

  // Loading & error
  const [isAnalyzingFridge, setIsAnalyzingFridge] = useState<boolean>(false);
  const [isGeneratingCuisine, setIsGeneratingCuisine] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * 1. Analyze Fridge (Photo and/or Text)
   */
  const handleAnalyzeFridge = async (payload: {
    photoBase64?: string;
    photoMimeType?: string;
    textIngredients?: string;
    dietaryRestrictions: string[];
  }) => {
    setIsAnalyzingFridge(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-fridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to analyze fridge`);
      }

      const data = await response.json();

      if (data.detectedIngredients && Array.isArray(data.detectedIngredients)) {
        setDetectedDetails(data.detectedIngredients);
        // Merge into active fridge ingredients list without duplicates
        const detectedNames = data.detectedIngredients.map((d: any) => d.name);
        setFridgeIngredients((prev) => {
          const set = new Set([...prev, ...detectedNames]);
          return Array.from(set);
        });
      }

      if (data.chefSummary) {
        setChefSummary(data.chefSummary);
      }

      if (data.meals && Array.isArray(data.meals)) {
        setQuickMeals(data.meals);
      }

      showToast('🎉 Fridge audit complete! Meals generated from what you have.');
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to scan fridge right now. Please try again.');
    } finally {
      setIsAnalyzingFridge(false);
    }
  };

  /**
   * 2. Generate Cuisine Meals & Store Guide
   */
  const handleGenerateCuisinePlan = async (params: {
    cuisine: string;
    mealPreference: string;
    servings: number;
    desiredSkillLevel: string;
  }) => {
    setIsGeneratingCuisine(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/cuisine-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          fridgeIngredients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to scout cuisine`);
      }

      const data = await response.json();
      setCuisinePlan(data);
      showToast(`✨ Found 3 authentic ${params.cuisine} recipes with store buying guide!`);

      // Scroll smoothly down to the recipes section
      setTimeout(() => {
        document.getElementById('cuisine-recipes-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to scout cuisine right now. Please try again.');
    } finally {
      setIsGeneratingCuisine(false);
    }
  };

  /**
   * 3. Scout Single Ingredient Store / Sub
   */
  const handleScoutIngredient = async (ingredient: string): Promise<IngredientScoutResult | null> => {
    try {
      const response = await fetch('/api/ingredient-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient }),
      });
      if (!response.ok) throw new Error('Failed to scout');
      return await response.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  /**
   * 4. Add items to shopping list
   */
  const handleAddMissingToShoppingList = (items: MissingIngredientDetail[]) => {
    setShoppingList((prev) => {
      const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
      const newItems: ShoppingItem[] = items
        .filter((item) => !existingNames.has(item.name.toLowerCase()))
        .map((item) => ({
          ...item,
          id: `${item.name}-${Date.now()}-${Math.random()}`,
          checked: false,
        }));
      return [...prev, ...newItems];
    });

    showToast(`🛒 Added ${items.length} items to your Store Shopping List!`);
  };

  const handleToggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearShoppingList = () => {
    setShoppingList([]);
    showToast('Shopping list cleared.');
  };

  // Add/Remove from fridge
  const handleRemoveFridgeIngredient = (name: string) => {
    setFridgeIngredients((prev) => prev.filter((i) => i.toLowerCase() !== name.toLowerCase()));
    setDetectedDetails((prev) => prev.filter((i) => i.name.toLowerCase() !== name.toLowerCase()));
  };

  const handleAddFridgeIngredient = (name: string) => {
    if (!fridgeIngredients.some((i) => i.toLowerCase() === name.toLowerCase())) {
      setFridgeIngredients((prev) => [...prev, name]);
      setDetectedDetails((prev) => [
        ...prev,
        { name, category: 'Other', estimatedState: 'Manual entry' },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 dark:border-stone-200 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fridgeItemCount={fridgeIngredients.length}
        shoppingListCount={shoppingList.filter((i) => !i.checked).length}
        onOpenShoppingList={() => setIsShoppingListOpen(true)}
        onOpenIngredientScout={() => setIsIngredientScoutOpen(true)}
      />

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-10">
        {/* TAB 1: FRIDGE INVENTORY & ZERO-WASTE MEALS */}
        {activeTab === 'fridge' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Fridge Input Box */}
            <FridgeInputSection
              onAnalyze={handleAnalyzeFridge}
              isLoading={isAnalyzingFridge}
              onSetIngredientsList={setFridgeIngredients}
              currentIngredients={fridgeIngredients}
            />

            {/* Verified Inventory Section (if analyzed or has items) */}
            {detectedDetails.length > 0 && (
              <FridgeInventoryView
                detectedIngredients={detectedDetails}
                chefSummary={chefSummary}
                onProceedToCuisine={() => setActiveTab('cuisine')}
                onRemoveIngredient={handleRemoveFridgeIngredient}
                onAddIngredient={handleAddFridgeIngredient}
              />
            )}

            {/* Quick Meals made with current fridge items */}
            {quickMeals.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      Zero-Waste Kitchen
                    </span>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
                      Ready-to-Cook Meals from Your Fridge
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                      Dishes crafted specifically around the ingredients currently in your fridge.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('cuisine')}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>Craving a Specific Cuisine?</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickMeals.map((meal) => (
                    <RecipeCard
                      key={meal.id}
                      recipe={meal}
                      type="fridge-quick"
                      onViewDetails={setSelectedRecipe}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: THEMEALDB RECIPE DATABASE */}
        {activeTab === 'mealdb' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <MealDbExplorer
              fridgeIngredients={fridgeIngredients}
              onSelectRecipe={(recipe) => setSelectedMealDbRecipe(recipe)}
              onOpenShoppingList={() => setIsShoppingListOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: CUISINE SCOUT & STORE SHOPPING GUIDE */}
        {activeTab === 'cuisine' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Cuisine Selector Component */}
            <CuisineSelector
              onGenerateCuisinePlan={handleGenerateCuisinePlan}
              isLoading={isGeneratingCuisine}
              fridgeItemCount={fridgeIngredients.length}
            />

            {/* Results: Cuisine Recipes & Missing Ingredients Guide */}
            {cuisinePlan && (
              <div id="cuisine-recipes-section" className="space-y-6 pt-4">
                {/* Cuisine Culture Banner */}
                <div className="bg-gradient-to-r from-amber-600/10 via-orange-500/10 to-emerald-600/10 border border-amber-500/20 rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          Culinary Adventure
                        </span>
                        <span className="text-xs text-stone-500 font-semibold">• Authentic Dishes</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-1">
                        {cuisinePlan.cuisine} Cuisine Meal Options
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-2xl leading-relaxed">
                        {cuisinePlan.cuisineStory}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsShoppingListOpen(true)}
                      className="shrink-0 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-amber-600/30"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>View Consolidated Store Plan</span>
                    </button>
                  </div>
                </div>

                {/* Recipes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cuisinePlan.recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      type="cuisine"
                      onViewDetails={setSelectedRecipe}
                      onAddMissingToShoppingList={handleAddMissingToShoppingList}
                    />
                  ))}
                </div>

                {/* Consolidated Store Plan Preview */}
                {cuisinePlan.consolidatedShoppingPlan && cuisinePlan.consolidatedShoppingPlan.length > 0 && (
                  <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
                          <ShoppingBag className="w-5 h-5 mr-2 text-amber-600" />
                          Recommended Shopping Destinations for {cuisinePlan.cuisine}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Where to go to get every missing item authentic &amp; fresh:
                        </p>
                      </div>
                      <button
                        onClick={() => setIsShoppingListOpen(true)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                      >
                        <span>Open Checklist</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {cuisinePlan.consolidatedShoppingPlan.map((plan, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                              Store Recommendation #{idx + 1}
                            </span>
                            <div className="font-bold text-sm text-stone-900 dark:text-white">
                              {plan.storeType}
                            </div>
                            <ul className="mt-2.5 space-y-1">
                              {plan.items.slice(0, 4).map((it, i) => (
                                <li key={i} className="text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
                                  <span>• {it.name}</span>
                                  <span className="text-[10px] text-stone-400">{it.aisle}</span>
                                </li>
                              ))}
                              {plan.items.length > 4 && (
                                <li className="text-[10px] text-amber-600 font-semibold">
                                  + {plan.items.length - 4} more items...
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
                            <span className="text-[11px] text-stone-400">
                              {plan.items.length} items to pick up
                            </span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.storeType.split('(')[0] + ' grocery')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-rose-500 hover:text-rose-600"
                            >
                              Maps 📍
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 bg-white dark:bg-stone-900 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">
              PantryChef &amp; Cuisine Scout
            </span>
            <span>•</span>
            <span>Zero-waste fridge meal suggestions &amp; store guidance</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsIngredientScoutOpen(true)}
              className="hover:text-amber-600 transition-colors"
            >
              Where to buy ingredients?
            </button>
            <button
              onClick={() => setIsShoppingListOpen(true)}
              className="hover:text-amber-600 transition-colors"
            >
              Shopping List ({shoppingList.length})
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Recipe Detail & Cooking Mode Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddMissingToShoppingList={handleAddMissingToShoppingList}
        />
      )}

      {/* 2. TheMealDB Recipe Detail & Store Scout Modal */}
      {selectedMealDbRecipe && (
        <MealDbRecipeModal
          recipe={selectedMealDbRecipe}
          onClose={() => setSelectedMealDbRecipe(null)}
          onAddMissingToShoppingList={handleAddMissingToShoppingList}
          fridgeIngredients={fridgeIngredients}
        />
      )}

      {/* 2. Store Shopping List Modal */}
      {isShoppingListOpen && (
        <ShoppingListModal
          items={shoppingList}
          onClose={() => setIsShoppingListOpen(false)}
          onToggleItem={handleToggleShoppingItem}
          onClearList={handleClearShoppingList}
          onRemoveItem={handleRemoveShoppingItem}
        />
      )}

      {/* 3. Ingredient Store & Aisle Scout Modal */}
      {isIngredientScoutOpen && (
        <IngredientScoutModal
          onClose={() => setIsIngredientScoutOpen(false)}
          onSearchScout={handleScoutIngredient}
        />
      )}
    </div>
  );
}
