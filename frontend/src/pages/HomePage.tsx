import { Link, Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Users, Scissors, Info, AlertCircle, Phone } from 'lucide-react'
import { getToken, getUser } from '@/lib/api'

const services = [
  { name: 'Blow dry', duration: '30 min', price: 'R$ 25,00' },
  { name: 'Coloração', duration: '120 min', price: 'R$ 150,00' },
  { name: 'Corte', duration: '45 min', price: 'R$ 50,00' },
  { name: 'Manicure', duration: '60 min', price: 'R$ 35,00' },
  { name: 'Pedicure', duration: '60 min', price: 'R$ 45,00' },
]

const rules = [
  { icon: AlertCircle, text: 'Alterações ou cancelamentos podem ser feitos até 2 dias antes do agendamento.' },
  { icon: Phone, text: 'Com menos de 2 dias, entre em contato com o salão por telefone.' },
  { icon: Calendar, text: 'Quando você já tem um agendamento na semana, sugerimos agendar outros serviços no mesmo dia.' },
]

export function HomePage() {
  const isLoggedIn = !!getToken()
  const user = getUser()
  if (isLoggedIn && user?.role === 'professional') {
    return <Navigate to="/calendario" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Bem-vindo ao Cabeleleila Leila
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Agende seus serviços de beleza online. Escolha o horário, os serviços e acompanhe seu histórico.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/agendar">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    <Calendar className="mr-2 h-5 w-5" />
                    Fazer agendamento
                  </Button>
                </Link>
                <Link to="/historico">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                    <Clock className="mr-2 h-5 w-5" />
                    Ver histórico
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma variedade de serviços de beleza para você se sentir ainda mais especial.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.name} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:underline transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-lg text-foreground">{service.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Card className="bg-secondary/50 border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-serif text-2xl flex items-center justify-center gap-2">
                <Info className="h-6 w-6 text-foreground" />
                Regras de Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4 max-w-2xl mx-auto">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-background">
                      <rule.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <p className="text-muted-foreground pt-2">{rule.text}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/agendar">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Agendar</h3>
                  <p className="text-sm text-muted-foreground">Faça seu próximo agendamento</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/historico">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Histórico</h3>
                  <p className="text-sm text-muted-foreground">Veja seus agendamentos anteriores</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/equipe">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Equipe</h3>
                  <p className="text-sm text-muted-foreground">Gerencie agendamentos da equipe</p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-foreground" />
              <span className="font-serif font-semibold">Cabeleleila Leila</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
