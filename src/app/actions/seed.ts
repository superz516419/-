'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedSampleData() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // 1. Create Exercises
    const exercisesData = [
      { name: 'Barbell Bench Press', body_part: 'Chest', user_id: user.id },
      { name: 'Incline Dumbbell Press', body_part: 'Chest', user_id: user.id },
      { name: 'Triceps Pushdown', body_part: 'Triceps', user_id: user.id },
    ]

    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .insert(exercisesData)
      .select()

    if (exercisesError) throw exercisesError

    // 2. Create Routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name: 'Push Day (Chest/Triceps)',
      })
      .select()
      .single()

    if (routineError) throw routineError

    // 3. Link Exercises to Routine
    // Map created exercises to routine_exercises structure
    // We assume the order of exercises returned matches insertion order or we find them by name.
    // Ideally we should use the returned IDs.
    
    // Let's create a map or just find by name since we just inserted them.
    const bench = exercises.find(e => e.name === 'Barbell Bench Press')
    const incline = exercises.find(e => e.name === 'Incline Dumbbell Press')
    const pushdown = exercises.find(e => e.name === 'Triceps Pushdown')

    if (!bench || !incline || !pushdown) throw new Error('Failed to retrieve created exercises')

    const routineExercisesData = [
      {
        routine_id: routine.id,
        exercise_id: bench.id,
        order: 1,
        target_sets: 4,
        target_reps: 10, // Average of 8-12
        rest_seconds: 90,
      },
      {
        routine_id: routine.id,
        exercise_id: incline.id,
        order: 2,
        target_sets: 3,
        target_reps: 10,
        rest_seconds: 90,
      },
      {
        routine_id: routine.id,
        exercise_id: pushdown.id,
        order: 3,
        target_sets: 3,
        target_reps: 12,
        rest_seconds: 60,
      },
    ]

    const { error: linkError } = await supabase
      .from('routine_exercises')
      .insert(routineExercisesData)

    if (linkError) throw linkError

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
