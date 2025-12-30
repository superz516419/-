'use server'

import { createClient } from '@/utils/supabase/server'

export async function getLastLogForExercise(exerciseId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Find the last completed set for this exercise by this user
    // We join with workouts to ensure we only get sets from the current user
    // and potentially filter by completed workouts if needed (but last effort is last effort regardless of workout status usually)
    
    // However, due to RLS on workout_sets relying on workouts table, we need to be careful with joins.
    // The RLS policy for workout_sets is:
    // exists (select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid())
    // So we can directly query workout_sets and order by completed_at.

    const { data, error } = await supabase
      .from('workout_sets')
      .select(`
        *,
        workouts!inner (
          user_id,
          status
        )
      `)
      .eq('exercise_id', exerciseId)
      .eq('workouts.user_id', user.id) // Redundant with RLS but good for clarity
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null } // No history found
      }
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch exercise history' }
  }
}

export async function getExercisePersonalRecord(exerciseId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Find the max weight lifted for this exercise
    const { data, error } = await supabase
      .from('workout_sets')
      .select('weight_kg')
      .eq('exercise_id', exerciseId)
      .order('weight_kg', { ascending: false })
      .limit(1)
      .single()

    if (error) {
       if (error.code === 'PGRST116') {
         return { success: true, data: 0 }
       }
       return { success: false, error: error.message }
    }

    return { success: true, data: data.weight_kg }
  } catch (error) {
    return { success: false, error: 'Failed to fetch PR' }
  }
}
