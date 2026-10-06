import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  X,
  Plus,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { DEMO_FRIDGES, POPULAR_FRIDGE_ITEMS, DemoFridgeScenario } from '../data/demoFridges';

interface FridgeInputSectionProps {
  onAnalyze: (payload: {
    photoBase64?: string;
    photoMimeType?: string;
    textIngredients?: string;
    dietaryRestrictions: string[];
  }) => Promise<void>;
  isLoading: boolean;
  onSetIngredientsList: (ingredients: string[]) => void;
  currentIngredients: string[];
}

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Halal',
  'Low-Carb / Keto',
  'Quick (< 20 mins)',
];

export const FridgeInputSection: React.FC<FridgeInputSectionProps> = ({
  onAnalyze,
  isLoading,
  onSetIngredientsList,
  currentIngredients,
}) => {
  const [inputMode, setInputMode] = useState<'both' | 'photo' | 'text'>('both');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');
  const [ingredientText, setIngredientText] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler with compression/resizing for fast, reliable upload to Gemini
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    setPhotoMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      // Downscale image if too large (e.g. over 1600px) using canvas to optimize API latency
      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.85);
        setPhotoPreview(compressedDataUrl);
        setSelectedDemoId(null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const item = (tagToAdd || tagInput).trim();
    if (!item) return;

    if (!currentIngredients.some((i) => i.toLowerCase() === item.toLowerCase())) {
      onSetIngredientsList([...currentIngredients, item]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    const updated = currentIngredients.filter((_, i) => i !== index);
    onSetIngredientsList(updated);
  };

  const handleClearAllTags = () => {
    onSetIngredientsList([]);
    setPhotoPreview(null);
    setSelectedDemoId(null);
  };

  const handleApplyDemoFridge = (demo: DemoFridgeScenario) => {
    setSelectedDemoId(demo.id);
    setPhotoPreview(demo.imageThumbnail);
    setPhotoMimeType('image/svg+xml');

    // Split items by commas and clean up
    const items = demo.ingredientsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSetIngredientsList(items);
    setIngredientText(demo.ingredientsText);
  };

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSubmit = () => {
    const combinedText = [
      ...currentIngredients,
      ...(ingredientText ? [ingredientText] : []),
    ].join(', ');

    if (!photoPreview && !combinedText.trim()) {
      alert('Please upload a photo of your fridge or add at least one ingredient.');
      return;
    }

    onAnalyze({
      photoBase64: photoPreview || undefined,
      photoMimeType,
      textIngredients: combinedText,
      dietaryRestrictions: selectedDiets,
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200/80 dark:border-stone-800 transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full mb-1">
            Step 1 • Fridge Audit
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            What's inside your fridge &amp; pantry?
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Snap a photo of your shelves, type ingredients manually, or pick a demo fridge scenario to begin!
          </p>
        </div>

        {/* Input Mode Switcher */}
        <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setInputMode('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === 'both'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Photo + Text
          </button>
          <button
            onClick={() => setInputMode('photo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === 'photo'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Photo Only
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === 'text'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Type Only
          </button>
        </div>
      </div>

      {/* Demo Presets Bar */}
      <div className="pt-5 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            Quick Test: Try a Realistic Demo Fridge
          </span>
          {selectedDemoId && (
            <button
              onClick={() => setSelectedDemoId(null)}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              Reset preset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_FRIDGES.map((demo) => {
            const isSelected = selectedDemoId === demo.id;
            return (
              <button
                key={demo.id}
                onClick={() => handleApplyDemoFridge(demo)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-3 group ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  {demo.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-stone-900 dark:text-white truncate">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {demo.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Photo Upload Box (Hidden if 'text' mode) */}
        {inputMode !== 'text' && (
          <div className={inputMode === 'photo' ? 'lg:col-span-12' : 'lg:col-span-5'}>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              📸 Upload or Drag Fridge Photo
            </label>

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-stone-950 group">
                <img
                  src={photoPreview}
                  alt="Fridge preview"
                  className="w-full h-56 object-cover object-center group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute top-2 right-2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md rounded-xl p-1 text-white">
                  <button
                    onClick={() => {
                      setPhotoPreview(null);
                      setSelectedDemoId(null);
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-rose-300"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md rounded-xl px-3 py-1.5 text-xs text-white/90 flex items-center justify-between">
                  <span className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                    Photo ready for AI vision audit
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-300 hover:text-amber-200 font-semibold"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[224px] ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500/60 bg-stone-50/50 dark:bg-stone-800/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Drop fridge picture or click to browse
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                  Supports JPEG, PNG, WEBP. Gemini Vision detects jars, vegetables, proteins, and dairy automatically!
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
          </div>
        )}

        {/* Text / Tags Input Box (Hidden if 'photo' mode) */}
        {inputMode !== 'photo' && (
          <div className={inputMode === 'text' ? 'lg:col-span-12' : 'lg:col-span-7'}>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              📝 Ingredients on Hand ({currentIngredients.length} active items)
            </label>

            {/* Input tag field */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type an ingredient (e.g. Eggs, Tofu, Spinach) & press Enter..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-white placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 dark:hover:bg-stone-600 text-white text-sm font-semibold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Active Tags list */}
            {currentIngredients.length > 0 && (
              <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-800 min-h-[64px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Current Fridge &amp; Pantry Inventory
                  </span>
                  <button
                    onClick={handleClearAllTags}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {currentIngredients.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 shadow-xs group"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="ml-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick 1-click popular additions */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                Tap to quickly add common staples:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {POPULAR_FRIDGE_ITEMS.slice(0, 14).map((item) => {
                  const alreadyAdded = currentIngredients.some(
                    (i) => i.toLowerCase() === item.toLowerCase()
                  );
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => !alreadyAdded && handleAddTag(item)}
                      disabled={alreadyAdded}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        alreadyAdded
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 cursor-default opacity-75'
                          : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {alreadyAdded ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dietary Restrictions Bar */}
      <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800">
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
          🥗 Dietary Preferences or Needs (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((diet) => {
            const isSelected = selectedDiets.includes(diet);
            return (
              <button
                key={diet}
                type="button"
                onClick={() => toggleDiet(diet)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {isSelected ? '✓ ' : ''}
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
          <HelpCircle className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
          <span>
            {photoPreview
              ? 'AI will inspect both your photo & listed ingredients to audit the fridge.'
              : 'Add photo or ingredients to generate zero-waste meal suggestions.'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || (!photoPreview && currentIngredients.length === 0)}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
            isLoading || (!photoPreview && currentIngredients.length === 0)
              ? 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed shadow-none'
              : 'theme-btn-primary hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Scanning Fridge &amp; Creating Meals...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Audit Fridge &amp; Suggest Meals</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
