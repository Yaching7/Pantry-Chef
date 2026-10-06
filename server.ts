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

/**
 * 1. Analyze Fridge (Photo and/or Text)
 */
app.post('/api/analyze-fridge', async (req, res) => {
  try {
    const { photoBase64, photoMimeType = 'image/jpeg', textIngredients = '', dietaryRestrictions = [] } = req.body;

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
    return res.status(500).json({
      error: error?.message || 'Failed to analyze fridge ingredients. Please check your image or text and try again.',
    });
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
