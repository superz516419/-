'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/database.types'

type Workout = Database['public']['Tables']['workouts']['Row']
type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']

export async function startWorkout(routineId?: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if there is already an active workout
    const { data: activeWorkout } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .single()

    if (activeWorkout) {
      return { success: false, error: 'You already have an active workout', data: { workoutId: activeWorkout.id } }
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        routine_id: routineId || null,
        status: 'in_progress',
        start_time: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to start workout' }
  }
}

export async function logSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number
) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify workout ownership
    const { data: workout } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single()

    if (!workout || workout.user_id !== user.id) {
      return { success: false, error: 'Workout not found or access denied' }
    }

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight_kg: weight,
        reps: reps,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to log set' }
  }
}

export async function finishWorkout(workoutId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('workouts')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
      })
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to finish workout' }
  }
}

export async function getCurrentActiveWorkout() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Fetch the active workout along with its sets and routine details if any
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        routine:routines(*),
        sets:workout_sets(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" which is fine
       return { success: false, error: error.message }
    }

    if (!data) {
       return { success: true, data: null }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to check active workout' }
  }
}

export async function getWorkoutSummary(workoutId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Fetch workout with sets
    const { data: workout, error } = await supabase
      .from('workouts')
      .select(`
        *,
        sets:workout_sets(*)
      `)
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single()

    if (error || !workout) {
      return { success: false, error: 'Workout not found' }
    }

    // Calculate Stats
    const startTime = new Date(workout.start_time).getTime()
    const endTime = workout.end_time ? new Date(workout.end_time).getTime() : Date.now()
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60)

    const totalSets = workout.sets.length
    
    const totalVolume = workout.sets.reduce((acc, set) => {
      return acc + ((set.weight_kg || 0) * (set.reps || 0))
    }, 0)

    return {
      success: true,
      data: {
        durationMinutes,
        totalSets,
        totalVolume,
        completedAt: workout.end_time
      }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch summary' }
  }
}
