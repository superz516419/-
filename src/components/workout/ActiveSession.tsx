'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Check, Timer, SkipForward } from 'lucide-react'
import { logSet, finishWorkout } from '@/app/actions/workout'
import { getLastLogForExercise } from '@/app/actions/history'
import type { RoutineWithExercises } from '@/app/actions/routines'

interface ActiveSessionProps {
  workoutId: string
  routine: RoutineWithExercises
  initialHistory?: any
}

export default function ActiveSession({ workoutId, routine, initialHistory }: ActiveSessionProps) {
  const router = useRouter()
  
  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetNumber, setCurrentSetNumber] = useState(1)
  const [weight, setWeight] = useState<number>(0)
  const [reps, setReps] = useState<number>(0)
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(90) // Default 90s
  const [lastLog, setLastLog] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derived state for PR (Progressive Overload based on last session)
  const personalRecord = lastLog?.weight_kg || 0

  const currentExercise = routine.routine_exercises[currentExerciseIndex]
  const exerciseName = currentExercise?.exercises?.name || 'Unknown Exercise'

  // Load history when exercise changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentExercise) return
      
      // If we passed initial history for the first exercise, use it
      // Otherwise fetch it
      const result = await getLastLogForExercise(currentExercise.exercise_id)
      if (result.success && result.data) {
        setLastLog(result.data)
        // Auto-fill inputs with last time's data for convenience
        setWeight(result.data.weight_kg || 0)
        setReps(result.data.reps || 0)
      } else {
        setLastLog(null)
        setWeight(0)
        setReps(0)
      }
    }
    loadHistory()
  }, [currentExerciseIndex, currentExercise])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1)
      }, 1000)
    } else if (restTime === 0) {
      setIsResting(false)
    }
    return () => clearInterval(interval)
  }, [isResting, restTime])

  const handleLogSet = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    // OPTIMISTIC UI UPDATE
    // 1. Immediately show rest timer and increment set number
    const nextSetNumber = currentSetNumber + 1
    setCurrentSetNumber(nextSetNumber)
    setRestTime(currentExercise.rest_seconds || 90)
    setIsResting(true)

    // 2. Perform the server action in the background
    // We don't await this to block the UI transition
    logSet(
        workoutId,
        currentExercise.exercise_id,
        currentSetNumber, // Use the *current* set number before increment
        weight,
        reps
    ).then((result) => {
        if (!result.success) {
            // Rollback if failed (in a real app, we'd handle this more robustly)
            alert('Failed to save set in background: ' + result.error)
            setIsResting(false)
            setCurrentSetNumber(currentSetNumber)
        }
    }).catch((e) => {
        console.error(e)
        alert('Network error saving set')
    }).finally(() => {
        setIsSubmitting(false)
    })
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < routine.routine_exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
      setCurrentSetNumber(1)
      setIsResting(false)
    } else {
      // Workout Complete?
      // Maybe show a "Finish Workout" confirmation
      const confirmFinish = window.confirm("You've finished all exercises! Complete workout?")
      if (confirmFinish) {
        handleFinishWorkout()
      }
    }
  }

  const handleFinishWorkout = async () => {
    // Celebration Confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    })

    const result = await finishWorkout(workoutId)
    if (result.success) {
      setTimeout(() => {
        router.push(`/workout/summary?id=${workoutId}`) 
      }, 1500)
    } else {
      alert('Failed to finish workout')
    }
  }

  // Helper for input adjustment
  const adjustWeight = (amount: number) => setWeight((prev) => Math.max(0, prev + amount))
  const adjustReps = (amount: number) => setReps((prev) => Math.max(0, prev + amount))

  if (!currentExercise) return <div>No exercises in this routine!</div>

  if (isResting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-6xl font-bold mb-8 animate-pulse">{restTime}s</div>
        <div className="text-2xl mb-8 text-slate-300">Resting...</div>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button 
            size="lg" 
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
            onClick={() => setIsResting(false)}
          >
            <SkipForward className="mr-2 h-6 w-6" />
            Skip Rest
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="w-full h-16 text-xl text-black"
            onClick={() => setRestTime((prev) => prev + 30)}
          >
            <Plus className="mr-2 h-6 w-6" />
            Add 30s
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-md mx-auto p-4 space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center text-sm text-slate-500">
        <span>动作 {currentExerciseIndex + 1} / {routine.routine_exercises.length}</span>
        <Button variant="ghost" size="sm" onClick={handleFinishWorkout} className="text-red-500">
          结束训练
        </Button>
      </div>

      {/* Focus View */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 leading-tight">
          {exerciseName}
        </h1>
        <div className="text-xl font-medium text-blue-600">
          第 {currentSetNumber} 组
        </div>
        {lastLog ? (
          <div className="text-sm text-slate-500 bg-slate-100 py-1 px-3 rounded-full inline-block">
            上次成绩: {lastLog.weight_kg}kg × {lastLog.reps}
          </div>
        ) : (
          <div className="text-sm text-slate-400">暂无历史数据</div>
        )}
      </div>

      {/* Input Zone */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weight */}
        <div className="space-y-3">
          <label className="text-center block text-sm font-semibold text-slate-500">重量 (KG)</label>
          <div className="flex items-center space-x-2 relative">
            <Button size="icon" variant="outline" onClick={() => adjustWeight(-2.5)} className="h-12 w-12 shrink-0">
              <Minus className="h-6 w-6" />
            </Button>
            <div className="relative flex-1">
                <Input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className={`h-12 text-center text-xl font-bold ${weight > personalRecord && personalRecord > 0 ? 'text-green-600 border-green-200 bg-green-50' : ''}`}
                />
                {weight > personalRecord && personalRecord > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce whitespace-nowrap">
                        🏆 新纪录!
                    </div>
                )}
            </div>
            <Button size="icon" variant="outline" onClick={() => adjustWeight(2.5)} className="h-12 w-12 shrink-0">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Reps */}
        <div className="space-y-3">
          <label className="text-center block text-sm font-semibold text-slate-500">次数</label>
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="outline" onClick={() => adjustReps(-1)} className="h-12 w-12 shrink-0">
              <Minus className="h-6 w-6" />
            </Button>
            <Input 
              type="number" 
              value={reps} 
              onChange={(e) => setReps(Number(e.target.value))}
              className="h-12 text-center text-xl font-bold"
            />
            <Button size="icon" variant="outline" onClick={() => adjustReps(1)} className="h-12 w-12 shrink-0">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <Button 
          className="w-full h-24 text-3xl font-black tracking-wider shadow-xl"
          onClick={handleLogSet}
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '完成此组'}
        </Button>
      </div>

      {/* Navigation / Skip */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={handleNextExercise} className="text-slate-400">
          跳过动作 / 下一个 &rarr;
        </Button>
      </div>
    </div>
  )
}
