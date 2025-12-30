'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { getWorkoutSummary } from '@/app/actions/workout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Clock, Dumbbell, Hash, Home } from 'lucide-react'

const QUOTES = [
  "Light weight, baby!",
  "The only bad workout is the one that didn't happen.",
  "Strength does not come from physical capacity. It comes from an indomitable will.",
  "Don't wish for it, work for it.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "It never gets easier, you just get better.",
]

export default function WorkoutSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workoutId = searchParams.get('id')
  
  const [stats, setStats] = useState<any>(null)
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Trigger Confetti
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#ef4444', '#3b82f6']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#ef4444', '#3b82f6']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    // 2. Set Random Quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])

    // 3. Fetch Data
    if (workoutId) {
      getWorkoutSummary(workoutId).then((res) => {
        if (res.success) {
          setStats(res.data)
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [workoutId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading stats...</div>
  }

  if (!stats) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Workout Not Found</h1>
            <Link href="/">
                <Button>Return Home</Button>
            </Link>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 flex flex-col items-center">
      
      {/* Header */}
      <div className="mt-12 mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-100 rounded-full mb-4 shadow-lg animate-bounce">
            <Trophy className="h-12 w-12 text-yellow-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
          Workout Complete!
        </h1>
        <p className="text-slate-500 font-medium">Great job crushing your goals today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Clock className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{stats.durationMinutes}</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Minutes</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Dumbbell className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{Math.round(stats.totalVolume / 1000)}k</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Kg Volume</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm col-span-2">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Hash className="h-8 w-8 text-purple-500 mr-4" />
                    <div className="text-left">
                        <div className="text-3xl font-bold text-slate-900">{stats.totalSets}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Sets</div>
                    </div>
                </div>
                <div className="text-right text-sm text-slate-400">
                    {new Date(stats.completedAt).toLocaleDateString()}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Quote */}
      <div className="max-w-md w-full mb-12">
        <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 text-lg">
          "{quote}"
        </blockquote>
      </div>

      {/* Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <div className="max-w-md mx-auto">
            <Link href="/">
                <Button className="w-full h-14 text-lg font-bold shadow-lg">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
      </div>

    </div>
  )
}
