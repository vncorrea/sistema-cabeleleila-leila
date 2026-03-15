import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import { usersApi, getUser } from '@/lib/api'
import type { UserListItem } from '@/lib/api'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

const roleLabels: Record<string, string> = {
  professional: 'Cabelereira',
  receptionist: 'Recepcionista',
  admin: 'Admin',
}

export function UsuariosPage() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('')
  const [formRole, setFormRole] = useState<string>('professional')
  const [saving, setSaving] = useState(false)

  const user = getUser()

  const load = () => {
    setLoading(true)
    usersApi
      .list()
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error('Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole('professional')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formPassword || formPassword !== formPasswordConfirm) {
      toast.error('Preencha nome, e-mail, senha e confirmação iguais.')
      return
    }
    if (formPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      await usersApi.create({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        password_confirmation: formPasswordConfirm,
        role: formRole,
      })
      toast.success('Usuário criado.')
      resetForm()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (u: UserListItem) => {
    setEditingId(u.id)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole(u.role)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Nome e e-mail são obrigatórios.')
      return
    }
    if (formPassword && formPassword !== formPasswordConfirm) {
      toast.error('Senhas não conferem.')
      return
    }
    if (formPassword && formPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      await usersApi.update(editingId, {
        name: formName.trim(),
        email: formEmail.trim(),
        ...(formPassword ? { password: formPassword, password_confirmation: formPasswordConfirm } : {}),
        role: formRole,
      })
      toast.success('Usuário atualizado.')
      resetForm()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Excluir usuário?',
      text: `Deseja realmente excluir "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Não',
    })
    if (!isConfirmed) return
    try {
      await usersApi.delete(id)
      toast.success('Usuário excluído.')
      load()
      if (editingId === id) resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Usuários
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie cabelereiras e recepcionistas (apenas admin)
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </Button>
        </div>

        {(showForm || editingId) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar usuário' : 'Novo usuário'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nome</FieldLabel>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nome completo"
                      className="h-11"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>E-mail</FieldLabel>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="h-11"
                      disabled={!!editingId}
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{editingId ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'}</FieldLabel>
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                      className="h-11"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Confirmar senha</FieldLabel>
                    <Input
                      type="password"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Perfil</FieldLabel>
                    <Select value={formRole} onValueChange={(v) => setFormRole(v ?? 'professional')}>
                      <SelectTrigger className="h-11">
                        <SelectValue>{formRole ? roleLabels[formRole] : 'Selecione o perfil'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">{roleLabels.professional}</SelectItem>
                        <SelectItem value="receptionist">{roleLabels.receptionist}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium">Nome</th>
                      <th className="pb-3 font-medium">E-mail</th>
                      <th className="pb-3 font-medium">Perfil</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/70">
                        <td className="py-3">{u.name}</td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3">{roleLabels[u.role] ?? u.role}</td>
                        <td className="py-3 text-right">
                          {u.role !== 'admin' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(u)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(u.id, u.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
