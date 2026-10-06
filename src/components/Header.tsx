import React from 'react';
import {
  Refrigerator,
  Globe2,
  ShoppingCart,
  Search,
  UtensilsCrossed,
  Sparkles,
  Database,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'fridge' | 'mealdb' | 'cuisine';
  setActiveTab: (tab: 'fridge' | 'mealdb' | 'cuisine') => void;
  fridgeItemCount: number;
  shoppingListCount: number;
  onOpenShoppingList: () => void;
  onOpenIngredientScout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  fridgeItemCount,
  shoppingListCount,
  onOpenShoppingList,
  onOpenIngredientScout,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('fridge')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-stone-900 dark:text-white">
                  Pantry<span className="text-amber-600 dark:text-amber-400">Chef</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <Sparkles className="w-3 h-3 mr-1" /> Cuisine Scout
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                TheMealDB recipes • Fridge matching • Store &amp; aisle buying guides
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setActiveTab('fridge')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'fridge'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Refrigerator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. My Fridge</span>
              {fridgeItemCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                  {fridgeItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mealdb')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'mealdb'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Database className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>2. TheMealDB Recipes</span>
            </button>

            <button
              onClick={() => setActiveTab('cuisine')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'cuisine'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Globe2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>3. AI Cuisine Scout</span>
            </button>
          </nav>

          {/* Utility Tools: Shopping List, Ingredient Scout & Theme Selector */}
          <div className="flex items-center space-x-2">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline text-xs font-semibold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <span className="hidden lg:inline text-xs font-semibold">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenIngredientScout}
              title="Look up where to buy any ingredient"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Where to Buy?</span>
            </button>

            <button
              onClick={onOpenShoppingList}
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center space-x-1.5 shadow-sm shadow-amber-600/30"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Store List</span>
              {shoppingListCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold">
                  {shoppingListCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
