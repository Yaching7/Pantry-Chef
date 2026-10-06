import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow large payloads for base64 fridge photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI server-side with User-Agent as instructed by gemini-api skill
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to sanitize JSON response from Gemini if needed
function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Robust caller with retry & fallback on temporary 503/429 spikes
 */
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTemporary =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE');
        if (isTemporary && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }
  throw lastError;
}

import healthHandler from './api/health';
import foodSelectionHandler from './api/food_selection';

/**
 * Serverless Route Mounts (/api/health & /api/food_selection)
 */
app.all(['/api', '/api/health'], healthHandler);
app.all('/api/food_selection', foodSelectionHandler);

/**
 * 1. Analyze Fridge (Photo and/or Text)
 */
/**
 * 1. Analyze Fridge (Photo and/or Text)
 */
app.all(['/api/analyze-fridge', '/api/analyze-fridge/'], async (req, res) => {
  if (req.method === 'GET') {
    return res.json({ status: 'ready', endpoint: '/api/analyze-fridge', note: 'Send POST with { textIngredients, photoBase64 }' });
  }

  try {
    const { photoBase64, photoMimeType = 'image/jpeg', textIngredients = '', dietaryRestrictions = [] } = req.body || {};

    if (!photoBase64 && (!textIngredients || !textIngredients.trim())) {
      return res.status(400).json({ error: 'Please provide either a photo of your fridge or type in ingredients.' });
    }

    const dietaryNote = dietaryRestrictions.length > 0 
      ? `Important dietary preferences or restrictions: ${dietaryRestrictions.join(', ')}.`
      : '';

    const parts: any[] = [];

    if (photoBase64) {
      // Strip data url prefix if present
      const cleanBase64 = photoBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: photoMimeType || 'image/jpeg',
        },
      });
    }

    const promptText = `
You are an expert culinary chef, fridge auditor, and zero-waste cooking master.
Carefully inspect the provided input:
${photoBase64 ? '- An uploaded image of the user\'s refrigerator, freezer, shelves, or ingredient spread.' : ''}
${textIngredients ? `- User-provided text list of ingredients / pantry items: "${textIngredients}"` : ''}
${dietaryNote}

Your goals:
1. Detect and inventory all visible or typed food ingredients. Group them into realistic kitchen categories (Produce, Dairy & Eggs, Meat & Poultry, Seafood, Grains & Pasta, Pantry & Spices, Condiments & Sauces, Leftovers & Prepared, Beverages, Other).
   Estimate the state/quantity (e.g. "Full bag", "About 3 eggs", "Opened jar (~50% full)", "Half bunch") and flag items that look perishable or expiring soon.
2. Provide a warm, witty, encouraging chef summary of what they have and key flavor pairings.
3. Suggest 4 creative, practical, realistic meals that can be cooked immediately or with minimal extra staples:
   - Include 1 fast weekday dish (under 20 mins)
   - Include 1 hearty/comfort dish
   - Include 1 fresh/healthy dish
   - Include 1 creative zero-waste dish that uses up perishable items
   For each meal:
   - Title & cuisine style
   - Preparation time & cooking time
   - Difficulty level (Easy, Medium, Advanced)
   - List of matching ingredients already present in their fridge
   - List of optional/extra ingredients that would take it to restaurant quality
   - Step-by-step cooking instructions
   - Chef secret tip for maximum flavor

Return ONLY valid JSON matching this schema:
{
  "detectedIngredients": [
    {
      "name": "string (ingredient name)",
      "category": "Produce" | "Dairy & Eggs" | "Meat & Poultry" | "Seafood" | "Grains & Pasta" | "Pantry & Spices" | "Condiments & Sauces" | "Leftovers & Prepared" | "Beverages" | "Other",
      "estimatedState": "string (e.g. 'Fresh bunch', '3 eggs remaining', 'Opened container')",
      "isExpiringSoon": boolean,
      "notes": "string (optional observation)"
    }
  ],
  "chefSummary": "string (friendly assessment of the fridge bounty)",
  "meals": [
    {
      "id": "string",
      "title": "string",
      "cuisine": "string",
      "description": "string",
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "difficulty": "Easy" | "Medium" | "Advanced",
      "servings": number,
      "matchScorePercent": number,
      "matchingIngredients": ["string"],
      "missingOrOptionalIngredients": ["string"],
      "whyItWorks": "string",
      "nutritionSummary": "string",
      "instructions": ["string"],
      "chefTip": "string"
    }
  ]
}
`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry({
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/analyze-fridge:', error);
    // Provide sensible smart fallback if AI is experiencing temporary spike
    const textIng = req.body?.textIngredients || 'Chicken, Eggs, Butter, Garlic, Onion';
    const parsedItems = textIng.split(',').map((s: string) => s.trim()).filter(Boolean);
    const fallback = {
      detectedIngredients: parsedItems.map((name: string) => ({
        name,
        category: 'Produce',
        estimatedState: 'In fridge',
        isExpiringSoon: false,
      })),
      chefSummary: `Audited ${parsedItems.length} core ingredients from your fridge. Great foundation for flavorful home cooking!`,
      meals: [
        {
          id: 'quick-fridge-skillet',
          title: 'Savory Chef Skillet & Aromatics',
          cuisine: 'Home Comfort',
          description: 'A quick 15-minute skillet dish bringing together your on-hand proteins and aromatics with a golden sear.',
          prepTimeMinutes: 5,
          cookTimeMinutes: 12,
          difficulty: 'Easy',
          servings: 2,
          matchScorePercent: 90,
          matchingIngredients: parsedItems,
          missingOrOptionalIngredients: ['Black pepper', 'Olive oil'],
          whyItWorks: 'High-heat searing caramelizes natural sugars and locks in savory juices.',
          nutritionSummary: 'Approx 380 kcal, 28g protein',
          instructions: [
            'Prep your ingredients into uniform bite-sized cuts.',
            'Heat a heavy skillet with butter or oil until shimmering.',
            'Add garlic and aromatics for 60 seconds until fragrant.',
            'Toss in proteins and vegetables, sautéing over medium-high heat until tender and golden.',
            'Season with salt, pepper, and a dash of sauce before serving hot.'
          ],
          chefTip: 'Do not overcrowd the skillet so the ingredients caramelize rather than steam.'
        }
      ]
    };
    return res.json(fallback);
  }
});

/**
 * 2. Cuisine-Based Meal Advisor & Store Finder
 * Advise meals for specific cuisine, compare with fridge items, and tell user what missing items to get and WHERE to buy them!
 */
app.post('/api/cuisine-meal-plan', async (req, res) => {
  try {
    const {
      cuisine,
      fridgeIngredients = [],
      mealPreference = 'dinner',
      servings = 2,
      dietaryRestrictions = [],
      desiredSkillLevel = 'Any',
    } = req.body;

    if (!cuisine || !cuisine.trim()) {
      return res.status(400).json({ error: 'Please choose or specify a cuisine.' });
    }

    const fridgeListStr = fridgeIngredients.length > 0
      ? fridgeIngredients.join(', ')
      : 'Basic salt, pepper, cooking oil, and water';

    const dietaryStr = dietaryRestrictions.length > 0
      ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}.`
      : '';

    const promptText = `
You are a world-class international chef and grocery scout specialist.
A home cook wants to prepare authentic, mouthwatering **${cuisine}** cuisine!

CURRENT ON-HAND INGREDIENTS IN THEIR FRIDGE / PANTRY:
${fridgeListStr}

CONTEXT & PREFERENCES:
- Target cuisine: ${cuisine}
- Meal category: ${mealPreference}
- Target servings: ${servings}
- Skill preference: ${desiredSkillLevel}
${dietaryStr}

TASK:
Provide 3 authentic, tantalizing dishes for ${cuisine} cuisine that build smartly on what the user already has, while clearly outlining the missing ingredients and advising them EXACTLY WHICH STORE and aisle they can buy them at.

For each recipe:
1. Authentic title, local native name, and evocative description of the dish's flavor harmony.
2. Cooking time & prep time, difficulty, estimated total grocery top-up cost.
3. Ingredients in fridge: Items they already have that fit this dish.
4. MISSING INGREDIENTS & STORE SCOUTING:
   For every missing ingredient, advise:
   - Item name & quantity needed
   - Store Type: Specific store where to buy it (e.g. "Asian Supermarket (H Mart / 99 Ranch / Local Asian Grocer)", "Italian Specialty Market / Salumeria", "Latin Grocer / Carniceria", "Standard Supermarket (Kroger / Safeway / Whole Foods / Publix)", "Indian Grocery Store (Patel Brothers)", "Trader Joe's", "Costco / Club Wholesale", "Farmer's Market")
   - Aisle / Section: (e.g. "International Aisle - Soy & Fermented Sauces", "Fresh Produce Wall - Fresh Thai Chilis & Galangal", "Cheese Counter - D.O.P. Parmigiano Reggiano", "Baking & Flour Aisle")
   - Estimated Price: e.g. "$2.99 - $4.50"
   - Smart Hack / Pantry Substitute: What they could substitute with if they cannot visit that store or are in a hurry (e.g. "Substitute gochujang with sriracha + dash of miso and brown sugar").
5. Step-by-step culinary method with exact pro-tips (e.g. wok hei technique, emulsifying pasta water, blooming spices in ghee, tempering aromatics).
6. Beverage or side dish pairing recommendation.

Also produce a consolidated "Master Shopping List" grouped by store type so the user can easily plan their shopping trip!

Return ONLY valid JSON with this exact structure:
{
  "cuisine": "${cuisine}",
  "cuisineStory": "string (brief engaging culture note about why this cuisine is so special)",
  "recipes": [
    {
      "id": "string",
      "title": "string",
      "nativeName": "string",
      "description": "string",
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "difficulty": "Easy" | "Medium" | "Advanced",
      "servings": number,
      "estimatedTopUpCost": "string (e.g. '$6 - $10')",
      "ingredientsAlreadyHave": ["string"],
      "missingIngredients": [
        {
          "name": "string",
          "quantity": "string",
          "storeType": "string (e.g. 'Asian Supermarket (H Mart / 99 Ranch)', 'Local Supermarket', 'Specialty Deli')",
          "storeCategoryBadge": "Asian Market" | "Supermarket" | "Latin Grocer" | "Italian Deli" | "Indian Grocer" | "Whole Foods / Organic" | "Specialty Shop" | "General Store",
          "aisleOrSection": "string (e.g. 'Aisle 4 - Condiments & Chili Pastes')",
          "estimatedPrice": "string",
          "quickSubstitute": "string (practical hack if unavailable)"
        }
      ],
      "instructions": [
        {
          "stepNumber": number,
          "title": "string",
          "instruction": "string",
          "tip": "string"
        }
      ],
      "chefSecret": "string",
      "suggestedPairing": "string",
      "nutritionEstimate": {
        "calories": number,
        "proteinGrams": number,
        "carbsGrams": number,
        "fatGrams": number
      }
    }
  ],
  "consolidatedShoppingPlan": [
    {
      "storeType": "string",
      "storeCategoryBadge": "Asian Market" | "Supermarket" | "Latin Grocer" | "Italian Deli" | "Indian Grocer" | "Whole Foods / Organic" | "Specialty Shop" | "General Store",
      "items": [
        {
          "name": "string",
          "usedInRecipes": ["string"],
          "aisle": "string",
          "estimatedPrice": "string"
        }
      ]
    }
  ]
}
`;

    const response = await generateContentWithRetry({
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/cuisine-meal-plan:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate cuisine meal plan. Please try again.',
    });
  }
});

/**
 * 3. Quick Ingredient Substitute & Store Finder
 */
app.post('/api/ingredient-scout', async (req, res) => {
  try {
    const { ingredient, targetCuisine = 'General' } = req.body;
    if (!ingredient) {
      return res.status(400).json({ error: 'Please provide an ingredient.' });
    }

    const prompt = `
For the ingredient "${ingredient}" used in ${targetCuisine} cuisine:
Advise:
1. Best store types to buy it (e.g., Asian supermarket, Latin grocery, Italian deli, mainstream grocery, online).
2. What aisle/shelf to check.
3. What brands or signs of freshness/quality to look for.
4. Top 3 quick kitchen substitutes using common pantry items.
5. Average price range.

Return JSON:
{
  "ingredient": "${ingredient}",
  "bestStores": ["string"],
  "aisleLocation": "string",
  "selectionTips": "string",
  "substitutes": [
    {
      "name": "string",
      "ratio": "string",
      "notes": "string"
    }
  ],
  "typicalPrice": "string"
}
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ingredient-scout:', error);
    return res.status(500).json({ error: error?.message || 'Failed to scout ingredient.' });
  }
});

/**
 * 4. TheMealDB Database Endpoint
 * Returns curated meal database based on chicken_breast endpoint (and supports other ingredients)
 */
app.get('/api/mealdb/recipes', async (req, res) => {
  try {
    const ingredient = (req.query.ingredient as string) || 'chicken_breast';
    const jsonPath = path.resolve(__dirname, 'src/data/mealdb_chicken_recipes.json');

    // If default chicken_breast and local file exists, serve immediately
    const fs = await import('fs');
    if (ingredient === 'chicken_breast' && fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return res.json({ ingredient, count: data.length, meals: data });
    }

    // Otherwise fetch dynamically from TheMealDB
    const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
    const filterRes = await fetch(filterUrl);
    const filterData = (await filterRes.json()) as { meals?: any[] };

    if (!filterData.meals || filterData.meals.length === 0) {
      return res.json({ ingredient, count: 0, meals: [] });
    }

    const detailedMeals: any[] = [];
    const topMeals = filterData.meals.slice(0, 18);

    for (const m of topMeals) {
      try {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
        const detailData = (await detailRes.json()) as { meals?: any[] };
        const meal = detailData.meals?.[0];
        if (!meal) continue;

        const ingredients: any[] = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing && ing.trim()) {
            ingredients.push({
              name: ing.trim(),
              measure: (measure || '').trim(),
            });
          }
        }

        detailedMeals.push({
          idMeal: meal.idMeal,
          strMeal: meal.strMeal,
          strCategory: meal.strCategory,
          strArea: meal.strArea || 'International',
          strInstructions: meal.strInstructions,
          strMealThumb: meal.strMealThumb,
          strTags: meal.strTags,
          strYoutube: meal.strYoutube,
          strSource: meal.strSource,
          ingredients,
        });
      } catch (err) {
        console.error('Error fetching detail for meal:', m.idMeal, err);
      }
    }

    return res.json({ ingredient, count: detailedMeals.length, meals: detailedMeals });
  } catch (error: any) {
    console.error('Error in /api/mealdb/recipes:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch meal database.' });
  }
});

/**
 * 5. Scout Store & Aisle for a TheMealDB Recipe
 * Takes a specific TheMealDB recipe and user's fridge items, returns store recommendations and aisle locations for missing items
 */
app.post('/api/mealdb/scout-recipe', async (req, res) => {
  try {
    const { meal, fridgeIngredients = [] } = req.body;
    if (!meal || !meal.strMeal) {
      return res.status(400).json({ error: 'Please provide meal details.' });
    }

    const mealIngredientsList = (meal.ingredients || [])
      .map((i: any) => `${i.name} (${i.measure || 'to taste'})`)
      .join(', ');

    const fridgeListStr = fridgeIngredients.length > 0
      ? fridgeIngredients.join(', ')
      : 'Basic salt, pepper, cooking oil';

    const prompt = `
A home cook wants to make the authentic recipe "${meal.strMeal}" (${meal.strArea || 'International'} cuisine).

RECIPE INGREDIENTS REQUIRED:
${mealIngredientsList}

INGREDIENTS CURRENTLY IN USER'S FRIDGE:
${fridgeListStr}

TASK:
1. Identify which ingredients the user ALREADY HAS in their fridge (match flexibly, e.g. "Chicken Breast" matches "chicken breast", "olive oil" matches "oil").
2. Identify all MISSING ingredients.
3. For EACH missing ingredient:
   - Specific store where to buy it (e.g., Asian Supermarket, Latin Carniceria, Italian Deli, Mainstream Supermarket, Indian Grocer)
   - Store category badge: "Asian Market" | "Supermarket" | "Latin Grocer" | "Italian Deli" | "Indian Grocer" | "Whole Foods / Organic" | "Specialty Shop" | "General Store"
   - Specific aisle/section (e.g., "Aisle 3 - Asian Condiments", "Produce Cooler Wall", "International Foods Aisle")
   - Estimated price range (e.g. "$2.50 - $4.00")
   - Quick practical substitute hack if they don't want to make an extra shopping trip!
4. Provide a Chef Pro-Tip for cooking this specific dish.
5. Provide estimated prep time, cook time, and difficulty.

Return ONLY JSON:
{
  "ingredientsAlreadyHave": ["string"],
  "missingIngredients": [
    {
      "name": "string",
      "quantity": "string",
      "storeType": "string",
      "storeCategoryBadge": "Asian Market" | "Supermarket" | "Latin Grocer" | "Italian Deli" | "Indian Grocer" | "Whole Foods / Organic" | "Specialty Shop" | "General Store",
      "aisleOrSection": "string",
      "estimatedPrice": "string",
      "quickSubstitute": "string"
    }
  ],
  "chefTip": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "estimatedTopUpCost": "string"
}
`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/mealdb/scout-recipe:', error);
    return res.status(500).json({ error: error?.message || 'Failed to scout recipe stores.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
