import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Store,
  MapPin,
  Check,
  Copy,
  Trash2,
  ExternalLink,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MissingIngredientDetail, StoreCategoryBadge } from '../types';

interface ShoppingItem extends MissingIngredientDetail {
  id: string;
  checked?: boolean;
}

interface ShoppingListModalProps {
  items: ShoppingItem[];
  onClose: () => void;
  onToggleItem: (id: string) => void;
  onClearList: () => void;
  onRemoveItem: (id: string) => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  items,
  onClose,
  onToggleItem,
  onClearList,
  onRemoveItem,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Group items by store type
  const groupedByStore = items.reduce((acc, item) => {
    const key = item.storeType || 'Local Supermarket';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const completedCount = items.filter((i) => i.checked).length;

  const handleCopyList = () => {
    let text = `🛒 PANTRYCHEF GROCERY SHOPPING LIST\n`;
    text += `Generated for your cuisine adventure\n\n`;

    Object.entries(groupedByStore).forEach(([store, storeItems]) => {
      text += `🏪 STOP: ${store.toUpperCase()}\n`;
      storeItems.forEach((i) => {
        text += `  [${i.checked ? 'X' : ' '}] ${i.name} (${i.quantity}) - ${i.aisleOrSection} (~${i.estimatedPrice})\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMaps = (storeName: string) => {
    const cleanQuery = storeName.split('(')[0].trim();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery + ' grocery store')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggle = (id: string) => {
    onToggleItem(id);
    const updated = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    if (updated.length > 0 && updated.every((i) => i.checked)) {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  Consolidated Store Shopping Plan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {completedCount} / {items.length} bought
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Organized by store and supermarket aisle for efficient shopping.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {items.length > 0 && (
              <button
                onClick={handleCopyList}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center space-x-1"
                title="Copy list to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-200 text-base">
                Your Shopping List is Empty
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
                Explore a cuisine, select any recipe, and click "Add Missing" to automatically build your targeted grocery trip!
              </p>
            </div>
          ) : (
            Object.entries(groupedByStore).map(([storeName, storeItems]) => (
              <div
                key={storeName}
                className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-50/50 dark:bg-stone-800/30"
              >
                {/* Store Header */}
                <div className="p-3.5 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                      {storeName}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      ({storeItems.length} {storeItems.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  {/* Google Maps link */}
                  <button
                    onClick={() => handleOpenMaps(storeName)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 hover:bg-stone-200 text-[11px] font-semibold text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 flex items-center space-x-1"
                    title="Find closest store on Google Maps"
                  >
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>Find Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                  </button>
                </div>

                {/* Items in store */}
                <div className="divide-y divide-stone-200/60 dark:divide-stone-800 p-2">
                  {storeItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className={`p-3 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        item.checked
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 opacity-60'
                          : 'hover:bg-white dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs mt-0.5 transition-colors ${
                            item.checked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                          }`}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div
                            className={`text-xs sm:text-sm font-bold text-stone-900 dark:text-white ${
                              item.checked ? 'line-through text-stone-400 dark:text-stone-500' : ''
                            }`}
                          >
                            {item.name}
                            <span className="font-normal text-stone-500 ml-1.5 text-xs">
                              ({item.quantity})
                            </span>
                          </div>

                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex items-center space-x-2">
                            <span>📍 Aisle: {item.aisleOrSection}</span>
                          </div>

                          {item.quickSubstitute && (
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                              <span className="text-amber-600 font-medium">Alt: </span>
                              {item.quickSubstitute}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          {item.estimatedPrice}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          className="text-stone-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between">
            <button
              onClick={onClearList}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Entire List</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              Done Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
