'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { searchExercises, saveRoutine, type ExerciseInput } from '@/app/actions/builder'

export default function NewRoutinePage() {
  const router = useRouter()
  const [routineName, setRoutineName] = useState('')
  const [exercises, setExercises] = useState<ExerciseInput[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Modal State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState<{ id?: string, name: string } | null>(null)
  
  // Exercise Details State
  const [targetSets, setTargetSets] = useState(4)
  const [targetReps, setTargetReps] = useState(10) // Simplified to number for UI but logic can handle ranges later if needed
  const [restSeconds, setRestSeconds] = useState(90)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setSelectedExercise(null) // Reset selection if typing
    if (query.length > 1) {
      const result = await searchExercises(query)
      if (result.success && result.data) {
        setSearchResults(result.data)
      }
    } else {
      setSearchResults([])
    }
  }

  const handleSelectExercise = (ex: any) => {
    setSelectedExercise({ id: ex.id, name: ex.name })
    setSearchQuery(ex.name)
    setSearchResults([]) // Hide dropdown
  }

  const handleCreateNewExercise = () => {
    // User wants to create a new exercise with the current search query
    setSelectedExercise({ name: searchQuery })
    setSearchResults([])
  }

  const handleAddExercise = () => {
    if (!selectedExercise && !searchQuery) return

    const newExercise: ExerciseInput = {
      id: selectedExercise?.id, // undefined if new
      name: selectedExercise?.name || searchQuery,
      target_sets: targetSets,
      target_reps: targetReps,
      rest_seconds: restSeconds
    }

    setExercises([...exercises, newExercise])
    
    // Reset Modal
    setIsModalOpen(false)
    setSearchQuery('')
    setSelectedExercise(null)
    setTargetSets(4)
    setTargetReps(10)
    setRestSeconds(90)
  }

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises]
    newExercises.splice(index, 1)
    setExercises(newExercises)
  }

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      alert('Please enter a routine name')
      return
    }
    if (exercises.length === 0) {
      alert('Please add at least one exercise')
      return
    }

    setIsSaving(true)
    const result = await saveRoutine(routineName, exercises)
    if (result.success) {
      router.push('/')
    } else {
      alert('Failed to save routine: ' + result.error)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">新建计划</h1>
        
        {/* Routine Name */}
        <div className="space-y-2">
          <Label htmlFor="routineName">计划名称</Label>
          <Input 
            id="routineName" 
            placeholder="例如: 胸部训练" 
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className="text-lg font-semibold"
          />
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          <Label>动作列表</Label>
          {exercises.map((ex, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4 pr-12">
                <h3 className="font-bold text-slate-900">{ex.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {ex.target_sets} 组 × {ex.target_reps} 次 • {ex.rest_seconds}s 休息
                </p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                  onClick={() => handleRemoveExercise(index)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Exercise Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed border-2 h-14 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50">
              <Plus className="mr-2 h-5 w-5" />
              添加动作
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md top-[20%] translate-y-0">
            <DialogHeader>
              <DialogTitle>添加动作</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              
              {/* Search / Create */}
              <div className="space-y-2 relative">
                <Label>动作名称</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="搜索或输入新动作..." 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {searchResults.map(ex => (
                            <div 
                                key={ex.id}
                                className="p-3 hover:bg-slate-50 cursor-pointer text-sm font-medium"
                                onClick={() => handleSelectExercise(ex)}
                            >
                                {ex.name}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* "Create New" Option */}
                {searchQuery && searchResults.length === 0 && !selectedExercise && (
                    <div 
                        className="p-3 bg-blue-50 text-blue-700 rounded-md cursor-pointer text-sm flex items-center"
                        onClick={handleCreateNewExercise}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        新建 "{searchQuery}"
                    </div>
                )}
              </div>

              {/* Targets */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>组数</Label>
                    <Input type="number" value={targetSets} onChange={e => setTargetSets(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>次数</Label>
                    <Input type="number" value={targetReps} onChange={e => setTargetReps(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>休息 (秒)</Label>
                    <Input type="number" value={restSeconds} onChange={e => setRestSeconds(Number(e.target.value))} />
                </div>
              </div>

              <Button className="w-full h-12 text-lg font-bold" onClick={handleAddExercise}>
                加入计划
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Button (Sticky Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-up">
            <div className="max-w-md mx-auto">
                <Button 
                    className="w-full h-14 text-lg font-bold shadow-xl" 
                    onClick={handleSaveRoutine}
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : '保存计划'}
                    {!isSaving && <Save className="ml-2 h-5 w-5" />}
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
