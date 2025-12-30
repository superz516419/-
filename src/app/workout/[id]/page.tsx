import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ActiveSession from '@/components/workout/ActiveSession'
import { getRoutineDetails } from '@/app/actions/routines'

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verify Workout exists and is active
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !workout) {
    redirect('/')
  }

  if (workout.status === 'completed') {
    redirect('/') // Or to a summary page
  }

  // 2. Fetch the Routine details (exercises)
  // We need the routine attached to this workout
  if (!workout.routine_id) {
    return <div>Error: This workout has no routine attached.</div>
  }

  const routineResult = await getRoutineDetails(workout.routine_id)

  if (!routineResult.success || !routineResult.data) {
    return <div>Error loading routine details.</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ActiveSession 
        workoutId={id} 
        routine={routineResult.data} 
      />
    </div>
  )
}
