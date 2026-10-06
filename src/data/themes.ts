export interface ThemeDefinition {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  bannerGradient: string;
  activeTabColor: string;
  buttonGradient: string;
  accentText: string;
  accentBadge: string;
  ringColor: string;
}

export const CULINARY_THEMES: ThemeDefinition[] = [
  {
    id: 'warm-hearth',
    name: 'Warm Hearth',
    tagline: 'Cozy bakery & golden honey',
    icon: '🥖',
    primaryColor: '#d97706',
    secondaryColor: '#ea580c',
    bannerGradient: 'from-amber-500/10 via-orange-500/5 to-emerald-500/10',
    activeTabColor: 'text-amber-600 dark:text-amber-400',
    buttonGradient: 'from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    ringColor: 'ring-amber-500/40',
  },
  {
    id: 'herb-garden',
    name: 'Herb Garden',
    tagline: 'Crisp sage, mint & farm greens',
    icon: '🌿',
    primaryColor: '#059669',
    secondaryColor: '#0d9488',
    bannerGradient: 'from-emerald-500/10 via-teal-500/5 to-lime-500/10',
    activeTabColor: 'text-emerald-600 dark:text-emerald-400',
    buttonGradient: 'from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    ringColor: 'ring-emerald-500/40',
  },
  {
    id: 'tuscan-terracotta',
    name: 'Tuscan Clay',
    tagline: 'Saffron, paprika & sun-drenched herbs',
    icon: '🍅',
    primaryColor: '#c2410c',
    secondaryColor: '#b45309',
    bannerGradient: 'from-orange-600/10 via-amber-600/5 to-rose-600/10',
    activeTabColor: 'text-orange-600 dark:text-orange-400',
    buttonGradient: 'from-orange-600 via-rose-600 to-amber-700 hover:from-orange-500 hover:to-rose-500',
    accentText: 'text-orange-600 dark:text-orange-400',
    accentBadge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    ringColor: 'ring-orange-500/40',
  },
  {
    id: 'midnight-bistro',
    name: 'Midnight Bistro',
    tagline: 'Champagne brass & evening dining',
    icon: '🍷',
    primaryColor: '#ca8a04',
    secondaryColor: '#7c3aed',
    bannerGradient: 'from-yellow-500/10 via-purple-500/5 to-rose-500/10',
    activeTabColor: 'text-yellow-600 dark:text-yellow-400',
    buttonGradient: 'from-yellow-600 via-amber-600 to-stone-900 hover:from-yellow-500 hover:to-amber-500',
    accentText: 'text-yellow-600 dark:text-yellow-400',
    accentBadge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
    ringColor: 'ring-yellow-500/40',
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Slate',
    tagline: 'Cool fjord blue & clean prep',
    icon: '🫐',
    primaryColor: '#0284c7',
    secondaryColor: '#475569',
    bannerGradient: 'from-sky-500/10 via-slate-500/5 to-indigo-500/10',
    activeTabColor: 'text-sky-600 dark:text-sky-400',
    buttonGradient: 'from-sky-600 via-indigo-600 to-slate-800 hover:from-sky-500 hover:to-indigo-500',
    accentText: 'text-sky-600 dark:text-sky-400',
    accentBadge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    ringColor: 'ring-sky-500/40',
  },
];
