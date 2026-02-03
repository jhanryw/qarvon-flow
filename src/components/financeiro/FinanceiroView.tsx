import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Loader2, Filter, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Transaction = Tables<'transactions'>;

const categorias = {
  entrada: ['Receita Recorrente', 'Receita Pontual'],
  saida: ['Gasto Operacional', 'Pessoas', 'Imposto', 'Pró-labore', 'Cartão da Empresa']
};

// Helper to get first day of current month
const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper to get last day of current month
const getLastDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
};

export function FinanceiroView() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Date filters - default to current month
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());

  const [newTransaction, setNewTransaction] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: '',
    subcategoria: '',
    valor: '',
    cliente: '',
    canal: '' as '' | 'inbound' | 'outbound' | 'indicacao' | 'pap' | 'trafego_pago',
    observacoes: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newTransaction.categoria || !newTransaction.valor) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('transactions').insert({
      data: newTransaction.data,
      tipo: newTransaction.tipo,
      categoria: newTransaction.categoria,
      subcategoria: newTransaction.subcategoria || null,
      valor: parseFloat(newTransaction.valor.replace(',', '.')),
      cliente: newTransaction.cliente || null,
      canal: newTransaction.canal || null,
      observacoes: newTransaction.observacoes || null,
      user_id: user?.id
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a transação', variant: 'destructive' });
    } else {
      toast({ title: 'Transação salva!' });
      setDialogOpen(false);
      setNewTransaction({
        data: new Date().toISOString().split('T')[0],
        tipo: 'entrada',
        categoria: '',
        subcategoria: '',
        valor: '',
        cliente: '',
        canal: '',
        observacoes: ''
      });
      fetchTransactions();
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const { error } = await supabase.from('transactions').delete().eq('id', deleteId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a transação', variant: 'destructive' });
    } else {
      toast({ title: 'Transação excluída!' });
      fetchTransactions();
    }

    setDeleting(false);
    setDeleteId(null);
  };

  // Filtered calculations
  const filteredTransactions = useMemo(() => transactions, [transactions]);
  
  const totalEntradas = filteredTransactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = filteredTransactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  // Group by category for breakdown
  const breakdownByCategory = useMemo(() => {
    const grouped: Record<string, { entrada: number; saida: number }> = {};
    
    filteredTransactions.forEach(t => {
      if (!grouped[t.categoria]) {
        grouped[t.categoria] = { entrada: 0, saida: 0 };
      }
      if (t.tipo === 'entrada') {
        grouped[t.categoria].entrada += Number(t.valor);
      } else {
        grouped[t.categoria].saida += Number(t.valor);
      }
    });
    
    return grouped;
  }, [filteredTransactions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="w-6 h-6 text-primary" />
            Financeiro
          </h2>
          <p className="text-muted-foreground">Fluxo de caixa e movimentações</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-0 p-0 h-auto w-auto bg-transparent"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-0 p-0 h-auto w-auto bg-transparent"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
                <DialogDescription>Registre uma entrada ou saída no fluxo de caixa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newTransaction.data}
                      onChange={(e) => setNewTransaction({ ...newTransaction, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newTransaction.tipo}
                      onValueChange={(v) => setNewTransaction({ ...newTransaction, tipo: v as any, categoria: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={newTransaction.categoria}
                    onValueChange={(v) => setNewTransaction({ ...newTransaction, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias[newTransaction.tipo].map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subcategoria</Label>
                  <Input
                    placeholder="Ex: Software, Meta Ads..."
                    value={newTransaction.subcategoria}
                    onChange={(e) => setNewTransaction({ ...newTransaction, subcategoria: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    placeholder="0,00"
                    value={newTransaction.valor}
                    onChange={(e) => setNewTransaction({ ...newTransaction, valor: e.target.value })}
                  />
                </div>

                {newTransaction.tipo === 'entrada' && (
                  <>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Input
                        placeholder="Nome do cliente"
                        value={newTransaction.cliente}
                        onChange={(e) => setNewTransaction({ ...newTransaction, cliente: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal de Origem</Label>
                      <Select
                        value={newTransaction.canal}
                        onValueChange={(v) => setNewTransaction({ ...newTransaction, canal: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">Inbound</SelectItem>
                          <SelectItem value="outbound">Outbound</SelectItem>
                          <SelectItem value="indicacao">Indicação</SelectItem>
                          <SelectItem value="pap">PAP</SelectItem>
                          <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Informações adicionais..."
                    value={newTransaction.observacoes}
                    onChange={(e) => setNewTransaction({ ...newTransaction, observacoes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-success/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-success">
                  R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-success">Breakdown de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorias.entrada.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{cat}</span>
                  <span className="text-success font-bold">
                    R$ {(breakdownByCategory[cat]?.entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Breakdown de Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorias.saida.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{cat}</span>
                  <span className="text-destructive font-bold">
                    R$ {(breakdownByCategory[cat]?.saida || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Planilha de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação no período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subcategoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Canal</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Observações</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                    {isAdmin && <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          t.tipo === 'entrada' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {t.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{t.categoria}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{t.subcategoria || '-'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{t.cliente || '-'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{t.canal || '-'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                        {t.observacoes || '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-bold ${
                        t.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                      }`}>
                        {t.tipo === 'entrada' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={7} className="py-3 px-4 text-right">Total do Período:</td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-success">+ R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-destructive">- R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className={`border-t border-border pt-1 mt-1 ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                        = R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    {isAdmin && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
