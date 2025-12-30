'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchExercises(query: string) {
  const supabase = await createClient()
  
  // Search for exercises matching name
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export type ExerciseInput = {
  id?: string // If present, use existing. If missing, create new.
  name: string
  target_sets: number
  target_reps: number
  rest_seconds: number
}

export async function saveRoutine(routineName: string, exercisesList: ExerciseInput[]) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // 1. Create Routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name: routineName,
      })
      .select()
      .single()

    if (routineError) throw routineError

    // 2. Process Exercises
    const routineExercisesToInsert = []

    for (let i = 0; i < exercisesList.length; i++) {
      const ex = exercisesList[i]
      let exerciseId = ex.id

      // If no ID, create the exercise on the fly
      if (!exerciseId) {
        const { data: newExercise, error: createError } = await supabase
          .from('exercises')
          .insert({
            name: ex.name,
            user_id: user.id, // Custom exercise for this user
          })
          .select()
          .single()

        if (createError) throw createError
        exerciseId = newExercise.id
      }

      routineExercisesToInsert.push({
        routine_id: routine.id,
        exercise_id: exerciseId,
        order: i + 1,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        rest_seconds: ex.rest_seconds,
      })
    }

    // 3. Insert Routine Exercises
    if (routineExercisesToInsert.length > 0) {
      const { error: linkError } = await supabase
        .from('routine_exercises')
        .insert(routineExercisesToInsert)

      if (linkError) throw linkError
    }

    revalidatePath('/')
    return { success: true, data: routine }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
