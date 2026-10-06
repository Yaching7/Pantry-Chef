export interface DemoFridgeScenario {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  ingredientsText: string;
  imageThumbnail: string; // SVG data uri for crisp immediate preview
  sampleCategories: {
    name: string;
    items: string[];
  }[];
}

// Clean SVG illustrations for demo fridge thumbnails
const svgFridgeVeggie = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23ecfdf5"/><rect x="20" y="20" width="360" height="220" rx="16" fill="%23ffffff" stroke="%2310b981" stroke-width="4"/><line x1="20" y1="130" x2="380" y2="130" stroke="%23a7f3d0" stroke-width="3"/><circle cx="80" cy="80" r="30" fill="%23fef08a"/><circle cx="160" cy="75" r="26" fill="%23fca5a5"/><rect x="240" y="55" width="100" height="50" rx="8" fill="%23bbf7d0"/><rect x="60" y="160" width="80" height="50" rx="6" fill="%23fed7aa"/><circle cx="200" cy="185" r="28" fill="%2386efac"/><rect x="270" y="150" width="70" height="65" rx="10" fill="%23fbcfe8"/><text x="200" y="245" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23047857" text-anchor="middle">Loaded Produce &amp; Dairy Fridge</text></svg>`;

const svgFridgeAsian = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23fff7ed"/><rect x="20" y="20" width="360" height="220" rx="16" fill="%23ffffff" stroke="%23f97316" stroke-width="4"/><line x1="20" y1="130" x2="380" y2="130" stroke="%23fed7aa" stroke-width="3"/><rect x="60" y="50" width="70" height="60" rx="8" fill="%23fef08a"/><rect x="160" y="45" width="60" height="70" rx="8" fill="%23f87171"/><rect x="250" y="50" width="90" height="60" rx="10" fill="%23fed7aa"/><circle cx="90" cy="180" r="25" fill="%2386efac"/><rect x="150" y="155" width="75" height="55" rx="6" fill="%23fdba74"/><circle cx="280" cy="180" r="26" fill="%23fbcfe8"/><text x="200" y="245" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23c2410c" text-anchor="middle">East Asian Pantry &amp; Fresh Essentials</text></svg>`;

const svgFridgeEveryday = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23f0fdf4"/><rect x="20" y="20" width="360" height="220" rx="16" fill="%23ffffff" stroke="%233b82f6" stroke-width="4"/><line x1="20" y1="130" x2="380" y2="130" stroke="%23bfdbfe" stroke-width="3"/><rect x="50" y="45" width="90" height="65" rx="10" fill="%23f87171"/><rect x="170" y="50" width="80" height="60" rx="8" fill="%23fef08a"/><rect x="270" y="40" width="70" height="70" rx="6" fill="%23bbf7d0"/><circle cx="100" cy="185" r="26" fill="%23fdba74"/><rect x="160" y="160" width="80" height="50" rx="8" fill="%23cbd5e1"/><circle cx="290" cy="185" r="28" fill="%23fca5a5"/><text x="200" y="245" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231d4ed8" text-anchor="middle">Quick Weekday Protein &amp; Staples</text></svg>`;

export const DEMO_FRIDGES: DemoFridgeScenario[] = [
  {
    id: 'demo-veggie-dairy',
    title: 'Fresh Veggies, Dairy & Chicken',
    tagline: 'Farm-fresh eggs, baby spinach, chicken breast, Greek yogurt, bell peppers, cheddar.',
    icon: '🥦',
    imageThumbnail: svgFridgeVeggie,
    ingredientsText:
      '6 large eggs, 2 chicken breasts (boneless), 1 tub plain Greek yogurt, 1 bag baby spinach (needs using up), 2 red bell peppers, 1 wedge sharp cheddar cheese, 4 cloves garlic, 1 yellow onion, 2 tbsp butter, olive oil, lemons',
    sampleCategories: [
      { name: 'Produce', items: ['Baby spinach (expiring)', 'Red bell peppers', 'Garlic', 'Yellow onion', 'Lemons'] },
      { name: 'Dairy & Eggs', items: ['6 Eggs', 'Sharp cheddar', 'Greek yogurt', 'Butter'] },
      { name: 'Protein', items: ['Chicken breasts'] },
      { name: 'Pantry', items: ['Olive oil', 'Salt & Pepper'] },
    ],
  },
  {
    id: 'demo-asian-pantry',
    title: 'Tofu, Kimchi, Scallions & Rice',
    tagline: 'Firm tofu, scallions, eggs, soy sauce, sesame oil, kimchi, and leftover jasmine rice.',
    icon: '🥢',
    imageThumbnail: svgFridgeAsian,
    ingredientsText:
      '1 block firm tofu, 1 jar kimchi, 4 eggs, 1 bunch fresh scallions (green onions), 2 carrots, 2 cups leftover cooked white rice, soy sauce, toasted sesame oil, chili crisp jar, fresh ginger root',
    sampleCategories: [
      { name: 'Produce', items: ['Green scallions', 'Carrots', 'Fresh ginger'] },
      { name: 'Plant Protein & Dairy', items: ['Firm tofu', 'Eggs'] },
      { name: 'Fermented & Condiments', items: ['Kimchi', 'Chili crisp', 'Soy sauce', 'Toasted sesame oil'] },
      { name: 'Grains', items: ['Leftover white rice'] },
    ],
  },
  {
    id: 'demo-quick-staples',
    title: 'Ground Beef, Pasta, Tomatoes & Cheese',
    tagline: 'Ground beef, can of San Marzano tomatoes, spaghetti, mozzarella, garlic, mushrooms.',
    icon: '🍝',
    imageThumbnail: svgFridgeEveryday,
    ingredientsText:
      '1 lb ground beef (85/15), 1 box spaghetti, 1 can crushed tomatoes, 1 ball fresh mozzarella, 8 oz button mushrooms, 1 white onion, 5 cloves garlic, dried oregano, parmesan cheese rind, olive oil',
    sampleCategories: [
      { name: 'Protein', items: ['Ground beef (1 lb)'] },
      { name: 'Produce', items: ['Button mushrooms', 'White onion', 'Garlic'] },
      { name: 'Dairy', items: ['Fresh mozzarella', 'Parmesan rind'] },
      { name: 'Pantry', items: ['Spaghetti', 'Canned crushed tomatoes', 'Dried oregano', 'Olive oil'] },
    ],
  },
];

export const POPULAR_FRIDGE_ITEMS = [
  'Eggs',
  'Chicken breast',
  'Garlic',
  'Onion',
  'Butter',
  'Milk',
  'Olive oil',
  'Soy sauce',
  'Cheddar cheese',
  'Parmesan',
  'Spinach',
  'Tomatoes',
  'Bell pepper',
  'Scallions',
  'Lemons',
  'Tofu',
  'Rice',
  'Pasta',
  'Ground beef',
  'Mushrooms',
  'Greek yogurt',
  'Carrots',
  'Ginger',
  'Potatoes',
];
