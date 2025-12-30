import { login, signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 flex flex-col items-center space-y-2 text-center">
        <div className="rounded-full bg-slate-900 p-3">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Iron Focus</h1>
        <p className="text-slate-500">Minimalist workout tracker.</p>
      </div>

      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-50"
              />
            </div>
            
            <div className="flex gap-4 pt-2">
                <Button formAction={login as any} className="w-full font-bold">
                Log In
                </Button>
                <Button formAction={signup as any} variant="outline" className="w-full font-bold">
                Sign Up
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
