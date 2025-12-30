'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- 1. FOOD DATABASE (Hardcoded for MVP) ---
interface FoodItem { 
  name: string; 
  calories: number; 
  protein: number; 
  carbs: number; 
  fat: number; 
  keywords: string[]; 
} 

const FOOD_DB: Record<string, FoodItem> = { 
  chicken: { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, keywords: ["chicken", "breast", "鸡胸", "鸡肉"] }, 
  egg: { name: "Egg", calories: 70, protein: 6, carbs: 0.6, fat: 5, keywords: ["egg", "eggs", "鸡蛋", "蛋"] }, 
  rice: { name: "Rice (Cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, keywords: ["rice", "米饭", "饭"] }, 
  beef: { name: "Beef", calories: 250, protein: 26, carbs: 0, fat: 15, keywords: ["beef", "steak", "牛肉", "牛排"] }, 
  oats: { name: "Oats", calories: 389, protein: 16.9, carbs: 66, fat: 6.9, keywords: ["oats", "燕麦"] }, 
  banana: { name: "Banana", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, keywords: ["banana", "香蕉"] }, 
  milk: { name: "Milk", calories: 60, protein: 3.2, carbs: 4.8, fat: 3.3, keywords: ["milk", "牛奶"] }, 
  apple: { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, keywords: ["apple", "苹果"] }, 
  whey: { name: "Whey Protein", calories: 120, protein: 24, carbs: 3, fat: 1, keywords: ["whey", "蛋白粉"] } 
}; 

// --- 2. ACTIONS ---

export async function updateProfile(data: { 
  weight: number; 
  height: number; 
  age: number; 
  gender: string; 
  activity_level: string; 
  goal: string; 
}) { 
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser() 
  if (!user) return 

  // FORCE UPSERT: Create if not exists, Update if exists 
  const { error } = await supabase 
    .from('profiles') 
    .upsert({ 
      id: user.id, 
      weight: data.weight, 
      height: data.height, 
      age: data.age, 
      gender: data.gender, 
      activity_level: data.activity_level, 
      goal: data.goal 
    }) 

  if (error) console.error("Profile Update Error:", error) 
  
  revalidatePath('/diet') // Force UI refresh 
} 

export async function getDailyNutrition() { 
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser() 
  if (!user) return null 

  // 1. Get Profile 
  const { data: profile } = await supabase 
    .from('profiles') 
    .select('*') 
    .eq('id', user.id) 
    .single() 

  // 2. Calculate Targets (Mifflin-St Jeor) 
  // Defaults 
  let weight = profile?.weight || 70; 
  let height = profile?.height || 175; 
  let age = profile?.age || 25; 
  let gender = profile?.gender || 'male'; 
  let activity = profile?.activity_level || 'moderate'; 
  let goal = profile?.goal || 'maintain'; 

  // BMR Calculation 
  let bmr = (10 * weight) + (6.25 * height) - (5 * age); 
  bmr += (gender === 'male' ? 5 : -161); 

  // Activity Multiplier 
  const multipliers: Record<string, number> = { 
    sedentary: 1.2, 
    light: 1.375, 
    moderate: 1.55, 
    active: 1.725, 
    very_active: 1.9 
  }; 
  const tdee = bmr * (multipliers[activity] || 1.55); 

  // Goal Adjustment 
  let targetCalories = tdee; 
  if (goal === 'cut') targetCalories -= 500; 
  if (goal === 'bulk') targetCalories += 500; 

  const targets = { 
    calories: Math.round(targetCalories), 
    protein: Math.round(weight * 2.0), // 2g per kg 
    carbs: Math.round((targetCalories * 0.4) / 4), // 40% of cals 
    fat: Math.round((targetCalories * 0.3) / 9)    // 30% of cals 
  }; 

  // 3. Get Today's Logs 
  const today = new Date().toISOString().split('T')[0] 
  const start = `${today}T00:00:00.000Z` 
  const end = `${today}T23:59:59.999Z` 

  const { data: logs } = await supabase 
    .from('food_logs') 
    .select('*') 
    .eq('user_id', user.id) 
    .gte('eaten_at', start) 
    .lte('eaten_at', end) 

  // 4. Sum Totals 
  const totals = logs?.reduce((acc, log) => ({ 
    calories: acc.calories + Number(log.calories), 
    protein: acc.protein + Number(log.protein), 
    carbs: acc.carbs + Number(log.carbs), 
    fat: acc.fat + Number(log.fat), 
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 }; 

  return { 
      success: true, 
      data: {
          profile, 
          targets, 
          logs, 
          totals 
      }
  }; 
} 

export async function logFood(foodInput: string) { 
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser() 
  if (!user) return 

  // 1. Pre-process input 
  const lowerInput = foodInput.toLowerCase().replace(/\s+/g, ''); // Remove spaces 
  let quantity = 1; 
  let isGrams = false; 

  // 2. Regex Strategies 
  // Strategy A: Explicit Count (e.g., "100个", "3 pieces") 
  const countMatch = lowerInput.match(/(\d+)(个|piece|slice|serving)/); 
  
  // Strategy B: Explicit Weight (e.g., "200g", "200克", "200ml") 
  const weightMatch = lowerInput.match(/(\d+)(g|ml|克|毫升)/); 

  // Strategy C: Just a Number (Fallback) 
  const numberMatch = lowerInput.match(/(\d+)/); 

  if (countMatch) { 
    // User said "100个", so take 100 directly 
    quantity = parseInt(countMatch[1]); 
  } else if (weightMatch) { 
    // User said "200g", standard serving is usually 100g, so 200/100 = 2 
    quantity = parseInt(weightMatch[1]) / 100; 
    isGrams = true; 
  } else if (numberMatch) { 
    // No unit found. Use Heuristic. 
    const val = parseInt(numberMatch[0]); 
    // If > 50, assume grams (e.g. "200 chicken" -> 200g -> 2 units) 
    // If <= 50, assume count (e.g. "2 eggs" -> 2 units) 
    if (val > 50) { 
      quantity = val / 100; 
    } else { 
      quantity = val; 
    } 
  } 

  // 3. Find Matching Food 
  let bestMatch = null; 
  for (const [key, data] of Object.entries(FOOD_DB)) { 
    if (data.keywords.some(k => lowerInput.includes(k))) { 
      bestMatch = data; 
      break; 
    } 
  } 

  if (!bestMatch) throw new Error("Food not found"); 

  // 4. Special Correction for "Grams" on Count-based items (Optional Polish) 
  // If user typed "100g egg", and egg is usually 1 unit (~50g), 100g should be 2 units. 
  // For MVP, we stick to the simple logic above, or you can refine it here. 

  // 5. Save to DB 
  await supabase.from('food_logs').insert({ 
    user_id: user.id, 
    food_name: bestMatch.name, 
    calories: bestMatch.calories * quantity, 
    protein: bestMatch.protein * quantity, 
    carbs: bestMatch.carbs * quantity, 
    fat: bestMatch.fat * quantity, 
    quantity: quantity 
  }) 

  revalidatePath('/diet') 
}