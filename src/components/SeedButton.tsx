'use client'

import { useState } from 'react'
import { seedSampleData } from '@/app/actions/seed'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      const result = await seedSampleData()
      if (!result.success) {
        alert(result.error)
      }
    } catch (e) {
      alert('Failed to seed data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading}
      variant="outline"
      className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
    >
      <Database className="mr-2 h-4 w-4" />
      {loading ? 'Setting up...' : 'Load Sample Routine'}
    </Button>
  )
}
