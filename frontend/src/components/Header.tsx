import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, Scissors } from 'lucide-react'
import { useState } from 'react'
import { authApi, clearToken, getToken, getUser } from '@/lib/api'

const allNavItems = [
  { name: 'Início', href: '/' },
  { name: 'Agendar', href: '/agendar' },
  { name: 'Calendário', href: '/calendario' },
  { name: 'Histórico', href: '/historico' },
  { name: 'Equipe', href: '/equipe' },
]

function getNavItemsForRole(role: string | undefined) {
  if (role === 'professional') {
    return allNavItems.filter((item) => item.href !== '/equipe' && item.href !== '/historico')
  }
  return allNavItems
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoggedIn = !!getToken()
  const user = getUser()
  const navigation = getNavItemsForRole(user?.role)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearToken()
    navigate('/')
    if (mobileMenuOpen) setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Cabeleleila Leila
          </span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
          {isLoggedIn ? (
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground h-9 px-4"
            >
              <LogOut className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-6 pb-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'block rounded-lg px-3 py-2 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isLoggedIn ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => { handleLogout() }}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogOut className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
