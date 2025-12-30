'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/database.types'

type Routine = Database['public']['Tables']['routines']['Row']
type RoutineExercise = Database['public']['Tables']['routine_exercises']['Row']

export type RoutineWithExercises = Routine & {
  routine_exercises: (RoutineExercise & {
    exercises: Database['public']['Tables']['exercises']['Row']
  })[]
}

export async function getRoutines() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch routines' }
  }
}

export async function getRoutineDetails(routineId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercises (*)
        )
      `)
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Sort exercises by order
    if (data && data.routine_exercises) {
      data.routine_exercises.sort((a, b) => a.order - b.order)
    }

    return { success: true, data: data as RoutineWithExercises }
  } catch (error) {
    return { success: false, error: 'Failed to fetch routine details' }
  }
}

export async function createRoutine(data: {
  name: string
  exercises: {
    exercise_id: string
    order: number
    target_sets?: number
    target_reps?: number
    rest_seconds?: number
  }[]
}) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // 1. Create Routine
    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name: data.name,
      })
      .select()
      .single()

    if (routineError) {
      return { success: false, error: routineError.message }
    }

    // 2. Create Routine Exercises
    if (data.exercises.length > 0) {
      const exercisesToInsert = data.exercises.map((ex) => ({
        routine_id: routineData.id,
        exercise_id: ex.exercise_id,
        order: ex.order,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        rest_seconds: ex.rest_seconds,
      }))

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) {
        // Rollback routine creation if exercises fail (manual rollback since no transactions in Supabase JS client yet mostly)
        // Or just return error. Ideally we use an RPC for atomic transactions but for now:
        await supabase.from('routines').delete().eq('id', routineData.id)
        return { success: false, error: exercisesError.message }
      }
    }

    return { success: true, data: routineData }
  } catch (error) {
    return { success: false, error: 'Failed to create routine' }
  }
}
