import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Trash2, 
  Loader2,
  UserPlus,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;
type AppRole = Enums<'app_role'>;

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  rh: 'RH',
  social_media: 'Social Media',
  gestor_trafego: 'Gestor de Tráfego',
  vendedor: 'Vendedor',
  sdr_outbound: 'SDR Outbound'
};

export function UserManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<(Profile & { roles: AppRole[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'vendedor' as AppRole
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profiles) {
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            roles: rolesData?.map(r => r.role) || []
          };
        })
      );
      setUsers(usersWithRoles);
    }
    
    setLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setAddingRole(true);

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: { nome: newUser.nome }
      }
    });

    if (authError) {
      toast({ title: 'Erro', description: authError.message, variant: 'destructive' });
      setAddingRole(false);
      return;
    }

    if (authData.user) {
      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newUser.role
        });

      if (roleError) {
        console.error('Error adding role:', roleError);
      }

      toast({ title: 'Usuário criado!', description: 'Um email de confirmação foi enviado' });
      setDialogOpen(false);
      setNewUser({ nome: '', email: '', password: '', role: 'vendedor' });
      fetchUsers();
    }

    setAddingRole(false);
  };

  const handleAddRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Erro', description: 'Usuário já possui essa função', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: 'Não foi possível adicionar a função', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Função adicionada!' });
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover a função', variant: 'destructive' });
    } else {
      toast({ title: 'Função removida' });
      fetchUsers();
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar usuários
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Cadastre novos usuários e gerencie permissões</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie uma conta para um novo membro da equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome completo"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={addingRole}>
                {addingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge 
                            key={role} 
                            variant={role === 'admin' ? 'default' : 'secondary'}
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleRemoveRole(user.id, role)}
                          >
                            {roleLabels[role]}
                            <Trash2 className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => handleAddRole(user.id, v as AppRole)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Adicionar função" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels)
                            .filter(([value]) => !user.roles.includes(value as AppRole))
                            .map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
