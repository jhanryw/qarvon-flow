import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Loader2 } from 'lucide-react';
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

type Transaction = Tables<'transactions'>;

const categorias = {
  entrada: ['Mensalidade', 'Setup', 'Consultoria', 'Comissão', 'Outros'],
  saida: ['Ferramentas', 'Tráfego', 'Folha', 'Infraestrutura', 'Marketing', 'Outros']
};

export function FinanceiroView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('data', { ascending: false })
      .limit(50);

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

  const totalEntradas = transactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="w-6 h-6 text-primary" />
            Financeiro
          </h2>
          <p className="text-muted-foreground">Fluxo de caixa e movimentações</p>
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
                <p className="text-2xl font-bold text-primary">
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação registrada ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Canal</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
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
                      <td className="py-3 px-4 text-sm">{t.categoria}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {t.cliente || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {t.canal || '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-medium ${
                        t.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                      }`}>
                        {t.tipo === 'entrada' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
