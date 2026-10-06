import React, { useState } from 'react';
import {
  Globe2,
  Sparkles,
  Users,
  Clock,
  ChevronRight,
  Store,
  Compass,
  Search,
  Check,
} from 'lucide-react';
import { POPULAR_CUISINES, CuisineDefinition } from '../data/cuisines';

interface CuisineSelectorProps {
  onGenerateCuisinePlan: (params: {
    cuisine: string;
    mealPreference: string;
    servings: number;
    desiredSkillLevel: string;
  }) => Promise<void>;
  isLoading: boolean;
  fridgeItemCount: number;
}

export const CuisineSelector: React.FC<CuisineSelectorProps> = ({
  onGenerateCuisinePlan,
  isLoading,
  fridgeItemCount,
}) => {
  const [selectedCuisine, setSelectedCuisine] = useState<string>('Italian');
  const [customCuisine, setCustomCuisine] = useState<string>('');
  const [mealPreference, setMealPreference] = useState<string>('Dinner');
  const [servings, setServings] = useState<number>(2);
  const [skillLevel, setSkillLevel] = useState<string>('Home Cook Friendly');

  const handleCuisineSelect = (name: string) => {
    setSelectedCuisine(name);
    setCustomCuisine('');
  };

  const handleCustomCuisineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCuisine.trim()) {
      setSelectedCuisine(customCuisine.trim());
    }
  };

  const currentCuisineDef = POPULAR_CUISINES.find(
    (c) => c.name.toLowerCase() === selectedCuisine.toLowerCase()
  );

  const handleSubmit = () => {
    const finalCuisine = customCuisine.trim() || selectedCuisine;
    if (!finalCuisine) {
      alert('Please choose or enter a cuisine.');
      return;
    }

    onGenerateCuisinePlan({
      cuisine: finalCuisine,
      mealPreference,
      servings,
      desiredSkillLevel: skillLevel,
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200/80 dark:border-stone-800 transition-all">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
            Step 2 • Cuisine Scout &amp; Store Guide
          </span>
          <span className="text-xs text-stone-500">
            Comparing against {fridgeItemCount} fridge items
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-1.5">
          What cuisine are you craving today?
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
          Pick any world tradition. Our AI will craft authentic recipes using what you have, and tell you{' '}
          <strong className="text-amber-600 dark:text-amber-400 font-semibold">
            exact stores, aisles, prices &amp; quick substitutes
          </strong>{' '}
          for any missing ingredients.
        </p>
      </div>

      {/* Cuisine Grid */}
      <div className="mt-6">
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
          Popular World Cuisines
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_CUISINES.map((item) => {
            const isSelected =
              selectedCuisine.toLowerCase() === item.name.toLowerCase() && !customCuisine;
            return (
              <button
                key={item.id}
                onClick={() => handleCuisineSelect(item.name)}
                className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group h-28 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-2xl sm:text-3xl">{item.flag}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                    {item.nativeTitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Cuisine Input */}
      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400 shrink-0">
            Craving something else?
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={customCuisine}
              onChange={(e) => {
                setCustomCuisine(e.target.value);
                if (e.target.value) {
                  setSelectedCuisine(e.target.value);
                }
              }}
              placeholder="e.g. Peruvian, Jamaican, Ethiopian, Filipino, Polish, Moroccan..."
              className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Active Cuisine Insights Card */}
      {currentCuisineDef && (
        <div className="mt-6 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <span className="text-4xl">{currentCuisineDef.flag}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-stone-900 dark:text-white">
                  {currentCuisineDef.name} Cuisine Profile
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  • {currentCuisineDef.region}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                {currentCuisineDef.tagline}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                  Signature Aromatics:
                </span>
                {currentCuisineDef.signatureAromatics.map((aromatic) => (
                  <span
                    key={aromatic}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300"
                  >
                    {aromatic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs">
            <div className="flex items-center space-x-1.5 text-stone-500 dark:text-stone-400 font-semibold mb-1">
              <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Primary Store Recommendation</span>
            </div>
            <div className="font-bold text-stone-900 dark:text-white text-[11px] max-w-xs">
              {currentCuisineDef.primaryStoreType}
            </div>
          </div>
        </div>
      )}

      {/* Preferences & Serving Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-200 dark:border-stone-800">
        {/* Meal Type */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Meal Occasion
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {['Dinner', 'Quick Lunch', 'Weekend Feast', 'Comfort Food'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealPreference(type)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center transition-all ${
                  mealPreference === type
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Servings */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Servings ({servings} people)</span>
            <Users className="w-3.5 h-3.5 text-stone-400" />
          </label>
          <div className="flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            {[1, 2, 4, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setServings(num)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  servings === num
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {num} {num === 1 ? 'person' : 'ppl'}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Level */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Skill &amp; Effort
          </label>
          <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            {['Quick & Easy', 'Home Cook', 'Chef Level'].map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setSkillLevel(skill)}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold text-center transition-all ${
                  skillLevel === skill
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
            isLoading
              ? 'bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Scouting {selectedCuisine} Recipes &amp; Stores...</span>
            </>
          ) : (
            <>
              <Compass className="w-5 h-5" />
              <span>Scout {selectedCuisine} Meals &amp; Missing Ingredients</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
