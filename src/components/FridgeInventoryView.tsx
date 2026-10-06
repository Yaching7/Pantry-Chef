import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  ArrowRight,
  Flame,
  ChefHat,
  Tag,
} from 'lucide-react';
import { DetectedIngredient, IngredientCategory } from '../types';

interface FridgeInventoryViewProps {
  detectedIngredients: DetectedIngredient[];
  chefSummary: string;
  onProceedToCuisine: () => void;
  onRemoveIngredient: (name: string) => void;
  onAddIngredient: (name: string) => void;
}

const CATEGORY_COLORS: Record<IngredientCategory, { badge: string; bg: string }> = {
  Produce: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', bg: 'border-emerald-300' },
  'Dairy & Eggs': { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', bg: 'border-amber-300' },
  'Meat & Poultry': { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', bg: 'border-rose-300' },
  Seafood: { badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300', bg: 'border-cyan-300' },
  'Grains & Pasta': { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300', bg: 'border-yellow-300' },
  'Pantry & Spices': { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300', bg: 'border-orange-300' },
  'Condiments & Sauces': { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', bg: 'border-purple-300' },
  'Leftovers & Prepared': { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', bg: 'border-blue-300' },
  Beverages: { badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', bg: 'border-teal-300' },
  Other: { badge: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300', bg: 'border-stone-300' },
};

export const FridgeInventoryView: React.FC<FridgeInventoryViewProps> = ({
  detectedIngredients,
  chefSummary,
  onProceedToCuisine,
  onRemoveIngredient,
  onAddIngredient,
}) => {
  const [newQuickItem, setNewQuickItem] = React.useState('');

  // Group detected ingredients by category
  const grouped = detectedIngredients.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, DetectedIngredient[]>);

  const expiringSoonCount = detectedIngredients.filter((i) => i.isExpiringSoon).length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuickItem.trim()) {
      onAddIngredient(newQuickItem.trim());
      setNewQuickItem('');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200/80 dark:border-stone-800">
      {/* Top Banner / Chef Summary */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 rounded-2xl p-5 border border-amber-500/20 mb-6">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Chef's Fridge Audit &amp; Insights
              </span>
              {expiringSoonCount > 0 && (
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {expiringSoonCount} item{expiringSoonCount > 1 ? 's' : ''} expiring soon
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
              {chefSummary ||
                'Here is the verified list of ingredients currently identified in your fridge. You can remove items or add anything we missed!'}
            </p>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white flex items-center">
            <span>Verified Fridge &amp; Pantry Inventory</span>
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {detectedIngredients.length} items
            </span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Click the &times; on any item you've run out of, or quickly add another staple.
          </p>
        </div>

        {/* Quick Add mini form */}
        <form onSubmit={handleQuickAdd} className="flex items-center space-x-2">
          <input
            type="text"
            value={newQuickItem}
            onChange={(e) => setNewQuickItem(e.target.value)}
            placeholder="Add missed ingredient..."
            className="px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Categorized Ingredient Grids */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => {
          const colors = CATEGORY_COLORS[category as IngredientCategory] || CATEGORY_COLORS.Other;
          return (
            <div key={category} className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-800/30">
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${colors.badge}`}>
                  {category} ({items.length})
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium bg-white dark:bg-stone-800 transition-all shadow-xs ${
                      item.isExpiringSoon
                        ? 'border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                        : 'border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.estimatedState && (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-normal">
                        • {item.estimatedState}
                      </span>
                    )}
                    {item.isExpiringSoon && (
                      <span
                        title="Use up soon to avoid waste"
                        className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500 text-white font-bold"
                      >
                        expiring
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveIngredient(item.name)}
                      className="text-stone-300 hover:text-rose-500 transition-colors ml-1"
                      title="Remove from inventory"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA to Step 2: Choose Cuisine */}
      <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-stone-500 dark:text-stone-400">
          Want authentic international food? Select your cuisine craving and let our AI scout the missing ingredients!
        </div>

        <button
          onClick={onProceedToCuisine}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>Choose Cuisine &amp; Scout Missing Ingredients</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
