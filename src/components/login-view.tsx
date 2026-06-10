'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function LoginView() {
  const { setView, setUser, setAuthToken } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Vyplňte všetky polia')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
        setAuthToken(data.token)
        toast.success(`Vitajte, ${data.user.name}!`)
        // Redirect based on role
        if (data.user.role === 'rider') {
          setView('rider-dashboard')
        } else if (data.user.role === 'admin') {
          setView('admin-dashboard')
        } else {
          setView('home')
        }
      } else {
        toast.error(data.error || 'Chyba pri prihlasovaní')
      }
    } catch {
      toast.error('Chyba pri prihlasovaní')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role: 'admin' | 'customer' | 'rider') {
    if (role === 'admin') {
      setEmail('admin@frastacan.sk')
      setPassword('admin123')
    } else if (role === 'rider') {
      setEmail('rider@frastacan.sk')
      setPassword('rider123')
    } else {
      setEmail('customer@test.sk')
      setPassword('customer123')
    }
  }

  return (
    <div className="view-transition max-w-md mx-auto px-4 py-8 sm:py-12">
      <Button variant="ghost" size="icon" className="mb-4" onClick={() => setView('home')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Prihlásenie</h1>
          <p className="text-muted-foreground mt-1">Vitajte späť vo Fraštačane!</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vas@email.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white h-11"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Prihlásiť sa'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Nemáte účet?{' '}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setView('register')}
                >
                  Zaregistrujte sa
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="border-0 shadow-sm mt-4 bg-primary/5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-primary">
              Demo účty na vyskúšanie
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">admin@frastacan.sk / admin123</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-primary/60 text-primary"
                onClick={() => fillDemo('admin')}
              >
                Vyplniť
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Zákazník</p>
                <p className="text-xs text-muted-foreground">customer@test.sk / customer123</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-primary/60 text-primary"
                onClick={() => fillDemo('customer')}
              >
                Vyplniť
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Kurier</p>
                <p className="text-xs text-muted-foreground">rider@frastacan.sk / rider123</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-primary/60 text-primary"
                onClick={() => fillDemo('rider')}
              >
                Vyplniť
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
