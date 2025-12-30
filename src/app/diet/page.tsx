'use client' 

import { useState, useEffect } from 'react' 
import Link from 'next/link'
import { getDailyNutrition, updateProfile, logFood } from '@/app/actions/diet' 
import { Card, CardContent } from '@/components/ui/card' 
import { Button } from '@/components/ui/button' 
import { ArrowLeft, Flame, Droplet, Wheat, Cookie } from 'lucide-react' 

export default function DietPage() { 
  const [data, setData] = useState<any>(null) 
  const [loading, setLoading] = useState(true) 
  const [foodInput, setFoodInput] = useState('') 
  
  // Profile Form State 
  const [form, setForm] = useState({ 
    weight: 70, 
    height: 175, 
    age: 25, 
    gender: 'male', 
    activity_level: 'moderate', 
    goal: 'maintain' 
  }) 

  // Load Data 
  useEffect(() => { 
    async function load() { 
      const res = await getDailyNutrition() 
      if (res) { 
        setData(res.data) 
        // Pre-fill form with DB data if exists 
        if (res.data.profile) { 
          setForm({ 
            weight: res.data.profile.weight || 70, 
            height: res.data.profile.height || 175, 
            age: res.data.profile.age || 25, 
            gender: res.data.profile.gender || 'male', 
            activity_level: res.data.profile.activity_level || 'moderate', 
            goal: res.data.profile.goal || 'maintain' 
          }) 
        } 
      } 
      setLoading(false) 
    } 
    load() 
  }, []) 

  const handleUpdate = async () => { 
    setLoading(true) 
    await updateProfile(form) 
    // Reload data to verify calculation 
    const res = await getDailyNutrition() 
    if (res) setData(res.data) 
    setLoading(false) 
  } 

  const handleLog = async () => { 
    if (!foodInput) return 
    try { 
      await logFood(foodInput) 
      setFoodInput('') 
      const res = await getDailyNutrition() 
      if (res) setData(res.data) 
    } catch (e) { 
      alert("Food not found! Try 'chicken', 'egg', 'rice'...") 
    } 
  } 

  if (loading && !data) return <div className="p-8">Loading Diet Brain...</div> 

  return ( 
    <div className="min-h-screen bg-slate-50 p-4 pb-20 space-y-6"> 
      <div className="mb-6"> 
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors"> 
          <ArrowLeft className="w-5 h-5 mr-1" /> 
          <span className="font-bold">Back to Dashboard (返回首页)</span> 
        </Link> 
      </div>
      <h1 className="text-2xl font-black text-slate-900">🧬 科学饮食设置 (Scientific Diet)</h1> 

      {/* --- Settings Card --- */} 
      <Card> 
        <CardContent className="p-4 space-y-4"> 
          <div className="grid grid-cols-2 gap-4"> 
            <div> 
              <label className="text-xs text-slate-500">Gender (性别)</label> 
              <select 
                className="w-full p-2 border rounded" 
                value={form.gender} 
                onChange={e => setForm({...form, gender: e.target.value})} 
              > 
                <option value="male">Male (男)</option> 
                <option value="female">Female (女)</option> 
              </select> 
            </div> 
            <div> 
              <label className="text-xs text-slate-500">Age (年龄)</label> 
              <input 
                type="number" className="w-full p-2 border rounded" 
                value={form.age} 
                onChange={e => setForm({...form, age: Number(e.target.value)})} 
              /> 
            </div> 
            <div> 
              <label className="text-xs text-slate-500">Height (cm)</label> 
              <input 
                type="number" className="w-full p-2 border rounded" 
                value={form.height} 
                onChange={e => setForm({...form, height: Number(e.target.value)})} 
              /> 
            </div> 
            <div> 
              <label className="text-xs text-slate-500">Weight (kg)</label> 
              <input 
                type="number" className="w-full p-2 border rounded" 
                value={form.weight} 
                onChange={e => setForm({...form, weight: Number(e.target.value)})} 
              /> 
            </div> 
            <div className="col-span-2"> 
              <label className="text-xs text-slate-500">Activity (活动量)</label> 
              <select 
                className="w-full p-2 border rounded" 
                value={form.activity_level} 
                onChange={e => setForm({...form, activity_level: e.target.value})} 
              > 
                <option value="sedentary">Sedentary (久坐/不运动)</option> 
                <option value="light">Light (每周1-3次)</option> 
                <option value="moderate">Moderate (每周3-5次)</option> 
                <option value="active">Active (每周6-7次)</option> 
                <option value="very_active">Very Active (体力工作/双练)</option> 
              </select> 
            </div> 
            <div className="col-span-2"> 
              <label className="text-xs text-slate-500">Goal (目标)</label> 
              <select 
                className="w-full p-2 border rounded" 
                value={form.goal} 
                onChange={e => setForm({...form, goal: e.target.value})} 
              > 
                <option value="cut">Cut (减脂 -500kcal)</option> 
                <option value="maintain">Maintain (维持)</option> 
                <option value="bulk">Bulk (增肌 +500kcal)</option> 
              </select> 
            </div> 
          </div> 
          <Button onClick={handleUpdate} className="w-full bg-slate-900"> 
            Update Targets (更新目标) 
          </Button> 
        </CardContent> 
      </Card> 

      {/* --- Progress Bars --- */} 
      <div className="grid grid-cols-1 gap-4"> 
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100"> 
          <div className="flex items-center gap-2 mb-2"> 
            <Flame className="w-5 h-5 text-orange-500" /> 
            <span className="font-bold text-orange-900">Calories (热量)</span> 
          </div> 
          <div className="text-3xl font-black text-slate-900 mb-1"> 
            {data?.totals.calories} <span className="text-sm text-slate-400 font-normal">/ {data?.targets.calories}</span> 
          </div> 
          <div className="h-2 bg-orange-200 rounded-full overflow-hidden"> 
            <div 
              className="h-full bg-orange-500 transition-all duration-500" 
              style={{ width: `${Math.min((data?.totals.calories / data?.targets.calories) * 100, 100)}%` }} 
            /> 
          </div> 
        </div> 

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"> 
          <div className="flex items-center gap-2 mb-2"> 
            <Droplet className="w-5 h-5 text-blue-500" /> 
            <span className="font-bold text-blue-900">Protein (蛋白质)</span> 
          </div> 
          <div className="text-3xl font-black text-slate-900 mb-1"> 
            {data?.totals.protein}g <span className="text-sm text-slate-400 font-normal">/ {data?.targets.protein}g</span> 
          </div> 
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden"> 
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${Math.min((data?.totals.protein / data?.targets.protein) * 100, 100)}%` }} 
            /> 
          </div> 
        </div> 
      </div> 

      {/* --- Logger --- */} 
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"> 
        <label className="text-sm font-bold text-slate-700 mb-2 block">What did you eat?</label> 
        <div className="flex gap-2"> 
          <input 
            type="text" 
            placeholder="e.g. 2 eggs, 200g chicken..." 
            className="flex-1 p-3 border rounded-lg bg-slate-50" 
            value={foodInput} 
            onChange={e => setFoodInput(e.target.value)} 
          /> 
          <Button onClick={handleLog} className="bg-green-600 hover:bg-green-700"> 
            Log 
          </Button> 
        </div> 
      </div> 

      {/* --- History --- */} 
      <div className="space-y-2"> 
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today's Logs</h3> 
        {data?.logs?.length === 0 && <p className="text-slate-400 text-sm">No food logged yet.</p>} 
        {data?.logs?.map((log: any) => ( 
          <div key={log.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100"> 
            <span className="font-medium text-slate-700">{log.food_name}</span> 
            <div className="text-right"> 
              <div className="font-bold text-slate-900">{Math.round(log.calories)} kcal</div> 
              <div className="text-xs text-slate-400">{Math.round(log.protein)}g pro</div> 
            </div> 
          </div> 
        ))} 
      </div> 
    </div> 
  ) 
} 
