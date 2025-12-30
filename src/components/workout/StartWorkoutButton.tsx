'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startWorkout } from '@/app/actions/workout'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export default function StartWorkoutButton({ routineId }: { routineId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const result = await startWorkout(routineId)
      if (result.success) {
        router.push(`/workout/${result.data.id}`)
      } else {
        if (result.error === 'You already have an active workout' && result.data?.workoutId) {
             router.push(`/workout/${result.data.workoutId}`)
        } else {
             alert(result.error)
        }
      }
    } catch (e) {
      alert('Error starting workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="icon" 
      className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-lg"
      onClick={handleStart}
      disabled={loading}
    >
      <Play className="h-5 w-5 fill-white ml-1" />
    </Button>
  )
}
