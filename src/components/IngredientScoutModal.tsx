import React, { useState } from 'react';
import {
  X,
  Search,
  Store,
  MapPin,
  Sparkles,
  HelpCircle,
  Tag,
  DollarSign,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { IngredientScoutResult } from '../types';

interface IngredientScoutModalProps {
  onClose: () => void;
  onSearchScout: (ingredient: string) => Promise<IngredientScoutResult | null>;
}

const COMMON_SEARCH_PROMPTS = [
  'Gochujang',
  'Fish Sauce',
  'Shaoxing Wine',
  'Kaffir Lime Leaves',
  'Pancetta / Guanciale',
  'Garam Masala',
  'Sumac',
  'Mirin',
  'Cotija Cheese',
  'Tahini',
];

export const IngredientScoutModal: React.FC<IngredientScoutModalProps> = ({
  onClose,
  onSearchScout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngredientScoutResult | null>(null);

  const handleSearch = async (termToSearch?: string) => {
    const term = (termToSearch || searchTerm).trim();
    if (!term) return;

    setLoading(true);
    setSearchTerm(term);
    try {
      const res = await onSearchScout(term);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                Ingredient Store &amp; Aisle Scout
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Wondering where to buy a rare ingredient or what to substitute it with?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type an ingredient (e.g. Shaoxing wine, Gochujang, Guanciale, Sumac)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Scout</span>
            </button>
          </form>

          {/* Quick Click Prompts */}
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-semibold text-stone-400">Popular:</span>
            {COMMON_SEARCH_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSearch(prompt)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading && (
            <div className="py-12 text-center text-stone-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="text-sm font-semibold">
                Consulting global grocery guides &amp; culinary databases...
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Store Scout Results
                  </span>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white capitalize">
                    {result.ingredient}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block uppercase">Typical Price</span>
                  <span className="text-sm font-bold text-stone-900 dark:text-white">
                    {result.typicalPrice}
                  </span>
                </div>
              </div>

              {/* Where to buy */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center mb-2">
                  <Store className="w-4 h-4 mr-1.5 text-amber-600" />
                  Recommended Stores
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.bestStores.map((st, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-800 text-stone-800 dark:text-stone-200 shadow-xs"
                    >
                      🏪 {st}
                    </span>
                  ))}
                </div>

                <div className="mt-3 text-xs text-stone-700 dark:text-stone-300">
                  <span className="font-semibold text-stone-900 dark:text-white">📍 Where in the store: </span>
                  {result.aisleLocation}
                </div>
              </div>

              {/* Selection Tips */}
              {result.selectionTips && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Quality &amp; Brand Tips
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {result.selectionTips}
                  </p>
                </div>
              )}

              {/* Substitutes */}
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-2">
                  💡 Kitchen Pantry Substitutes (If you can't buy it)
                </span>
                <div className="space-y-2">
                  {result.substitutes.map((sub, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                        <span>{sub.name}</span>
                        <span className="text-[11px] text-amber-600 font-semibold">{sub.ratio}</span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {sub.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center py-8 text-stone-400">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                Search any ingredient above to see store types, aisle locations, and home kitchen substitutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
