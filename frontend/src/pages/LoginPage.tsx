import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import { authApi, setToken, setUser } from '@/lib/api'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      setToken(data.data.token)
      setUser(data.data.user)
      toast.success('Login realizado.')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'E-mail ou senha incorretos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/10 backdrop-blur">
              <Scissors className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold text-primary-foreground mb-4">
            Cabeleleila Leila
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Beleza e elegância ao seu alcance. Agende seus serviços de forma prática e rápida.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Scissors className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif text-2xl font-semibold">Cabeleleila Leila</span>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center pb-8">
              <CardTitle className="font-serif text-2xl">Bem-vindo de volta</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
<Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        className="h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        className="h-12 pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </Field>
                </FieldGroup>

                <div className="flex items-center justify-end">
                  <Link
                    to="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>

                <Link to="/" className="block w-full">
                  <Button type="button" variant="outline" className="w-full h-12 text-base mt-2">
                    Continuar sem login
                  </Button>
                </Link>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Não tem uma conta? Entre em contato com o salão.
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contas para teste (projeto demo)
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { role: 'Admin (acesso total)', email: 'leila@cabeleleila.com', password: 'leila123' },
                { role: 'Cabelereira (só seus agendamentos)', email: 'carla@cabeleleila.com', password: 'carla123' },
                { role: 'Recepcionista (agenda + agendar)', email: 'maria@cabeleleila.com', password: 'maria123' },
              ].map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                    }}
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-background/80 transition-colors"
                  >
                    <span className="font-medium text-foreground block">{account.role}</span>
                    <span className="text-muted-foreground">
                      {account.email} / {account.password}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
