export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getRoutines } from '@/app/actions/routines'
import { getCurrentActiveWorkout } from '@/app/actions/workout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dumbbell, Activity, LogOut, Plus, Utensils } from 'lucide-react'
import StartWorkoutButton from '@/components/workout/StartWorkoutButton'
import SeedButton from '@/components/SeedButton'
import { logout } from '@/app/actions/auth'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50">
        <div className="rounded-full bg-slate-900 p-4 mb-6 shadow-xl">
          <Dumbbell className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-slate-900">IRON FOCUS</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Focus on lifting. We'll handle the numbers.</p>
        <Link href="/login" className="w-full max-w-xs">
            <Button size="lg" className="w-full font-bold text-lg h-14">Get Started</Button>
        </Link>
      </div>
    )
  }

  // 1. Check for Active Workout (Crash Recovery)
  const activeWorkoutResult = await getCurrentActiveWorkout()
  const activeWorkout = activeWorkoutResult.success ? activeWorkoutResult.data : null

  // 2. Fetch Routines
  const routinesResult = await getRoutines()
  const routines = routinesResult.success ? routinesResult.data : []

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      {/* Header */}
      <header className="mb-8 mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900">
          <Dumbbell className="h-8 w-8" />
          IRON FOCUS
        </h1>
        <div className="flex items-center gap-4">
            <Link href="/diet">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-green-600">
                    <Utensils className="h-5 w-5" />
                </Button>
            </Link>
            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
            <img 
                src={user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} 
                alt="User" 
                className="h-full w-full object-cover"
            />
            </div>
            <form action={logout}>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                    <LogOut className="h-5 w-5" />
                </Button>
            </form>
        </div>
      </header>

      {/* CRITICAL: Resume Workout Button */}
      {activeWorkout && (
        <section className="mb-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="h-32 w-32 text-red-900" />
             </div>
            <h2 className="text-red-600 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2 relative z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Active Session
            </h2>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xl font-bold text-slate-900">
                  {activeWorkout.routine?.name || 'Untitled Workout'}
                </p>
                <p className="text-slate-500 text-sm">
                  Started {new Date(activeWorkout.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Link href={`/workout/${activeWorkout.id}`}>
                <Button size="lg" className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 font-bold">
                  RESUME
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Routines List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">我的训练计划</h2>
          <Link href="/routines/new">
            <Button variant="ghost" size="sm" className="text-blue-600 font-semibold hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-1" />
                新建计划
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {routines?.map((routine) => (
            <Card key={routine.id} className="overflow-hidden transition-all hover:shadow-md border-slate-200 group cursor-pointer">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center mr-4 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Dumbbell className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900">{routine.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                        {new Date(routine.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <StartWorkoutButton routineId={routine.id} />
                </div>
              </CardContent>
            </Card>
          ))}

          {routines?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Dumbbell className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">暂无计划</h3>
              <p className="text-slate-500 text-sm mb-4">开始加载示例计划</p>
              <SeedButton />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
