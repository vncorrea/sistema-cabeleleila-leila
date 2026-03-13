import { Link } from 'react-router-dom'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-4 py-3">
        <nav className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="text-lg font-semibold">
            Cabeleleila Leila
          </Link>
          <div className="flex gap-4">
            <Link to="/" className="hover:underline">
              Início
            </Link>
            <Link to="/agendar" className="hover:underline">
              Agendar
            </Link>
            <Link to="/historico" className="hover:underline">
              Histórico
            </Link>
            <Link to="/equipe/agendamentos" className="hover:underline">
              Equipe
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}
