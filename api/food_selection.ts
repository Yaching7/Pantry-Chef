/**
 * Serverless Food Selection Endpoint
 * Path: /api/food_selection.ts
 *
 * Pulls data directly from TheMealDB database endpoint:
 * https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast
 *
 * Note: No API keys required for this endpoint.
 */

export interface MealDBIngredientItem {
  name: string;
  measure: string;
}

export interface MealDBFoodItem {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strYoutube?: string;
  strSource?: string;
  ingredients?: MealDBIngredientItem[];
}

// In-memory cache for fast serverless responses
const memoryCache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

export async function fetchMealDetails(idMeal: string): Promise<any | null> {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { meals?: any[] };
    const raw = json.meals?.[0];
    if (!raw) return null;

    const ingredients: MealDBIngredientItem[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = raw[`strIngredient${i}`];
      const measure = raw[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push({
          name: ing.trim(),
          measure: (measure || '').trim(),
        });
      }
    }

    return {
      idMeal: raw.idMeal,
      strMeal: raw.strMeal,
      strCategory: raw.strCategory || 'Chicken',
      strArea: raw.strArea || 'International',
      strInstructions: raw.strInstructions || '',
      strMealThumb: raw.strMealThumb || '',
      strYoutube: raw.strYoutube || '',
      strSource: raw.strSource || '',
      ingredients,
    };
  } catch (e) {
    console.error(`Failed to fetch detail for meal ${idMeal}:`, e);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract query parameter, default to 'chicken_breast'
    const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const rawIngredient =
      req.query?.i ||
      req.query?.ingredient ||
      url.searchParams.get('i') ||
      url.searchParams.get('ingredient') ||
      'chicken_breast';

    // Normalize ingredient for TheMealDB API (lowercase, replace spaces with underscores)
    const ingredient = String(rawIngredient).trim().toLowerCase().replace(/\s+/g, '_');

    const enrich =
      req.query?.enrich !== 'false' &&
      url.searchParams.get('enrich') !== 'false';

    const cacheKey = `${ingredient}-${enrich ? 'full' : 'basic'}`;
    const cached = memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      if (typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(200).json(cached.data);
      }
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pull from TheMealDB endpoint (no API key needed)
    const mealDbEndpoint = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
    let upstreamRes: Response | null = null;
    try {
      upstreamRes = await fetch(mealDbEndpoint);
    } catch (fetchErr) {
      console.warn(`Upstream fetch failed for ${mealDbEndpoint}:`, fetchErr);
    }

    let rawMeals: any[] = [];
    if (upstreamRes && upstreamRes.ok) {
      const upstreamData = (await upstreamRes.json().catch(() => ({}))) as { meals?: any[] };
      rawMeals = upstreamData.meals || [];
    }

    // Local fallback if upstream empty or failed and querying chicken
    if (rawMeals.length === 0 && (ingredient.includes('chicken') || ingredient === 'chicken_breast')) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const localPath = path.resolve(process.cwd(), 'src/data/mealdb_chicken_recipes.json');
        if (fs.existsSync(localPath)) {
          const fallbackData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
          rawMeals = fallbackData;
        }
      } catch (localErr) {
        console.warn('Could not read local chicken fallback:', localErr);
      }
    }

    let meals: MealDBFoodItem[] = [];

    if (enrich && rawMeals.length > 0) {
      // If items already have ingredients (e.g. from local fallback), use directly
      if (rawMeals[0]?.ingredients && Array.isArray(rawMeals[0]?.ingredients)) {
        meals = rawMeals;
      } else {
        // Enrich up to 20 meals with full ingredients and instructions
        const detailPromises = rawMeals.slice(0, 20).map(async (m) => {
          const detail = await fetchMealDetails(m.idMeal);
          return (
            detail || {
              idMeal: m.idMeal,
              strMeal: m.strMeal,
              strMealThumb: m.strMealThumb,
              strArea: 'International',
              ingredients: [],
            }
          );
        });
        meals = await Promise.all(detailPromises);
      }
    } else {
      meals = rawMeals.map((m) => ({
        idMeal: m.idMeal,
        strMeal: m.strMeal,
        strMealThumb: m.strMealThumb,
      }));
    }

    const responseData = {
      success: true,
      endpoint: mealDbEndpoint,
      authRequired: false,
      ingredient,
      totalCount: meals.length,
      meals,
    };

    memoryCache[cacheKey] = {
      timestamp: Date.now(),
      data: responseData,
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(responseData);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in /api/food_selection:', error);
    const errorPayload = {
      success: false,
      error: error?.message || 'Failed to fetch food selection from TheMealDB',
      authRequired: false,
      endpoint: 'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast',
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(500).json(errorPayload);
    }

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
