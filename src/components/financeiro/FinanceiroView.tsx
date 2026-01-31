import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

const transactions = [
  { id: '1', data: '2025-01-30', tipo: 'entrada', categoria: 'Mensalidade', cliente: 'Tech Solutions', valor: 3500, canal: 'outbound' },
  { id: '2', data: '2025-01-29', tipo: 'entrada', categoria: 'Mensalidade', cliente: 'Boutique Elegance', valor: 2800, canal: 'inbound' },
  { id: '3', data: '2025-01-28', tipo: 'saida', categoria: 'Ferramentas', subcategoria: 'Software', valor: 450 },
  { id: '4', data: '2025-01-27', tipo: 'entrada', categoria: 'Setup', cliente: 'Clínica Bella', valor: 5000, canal: 'trafego_pago' },
  { id: '5', data: '2025-01-26', tipo: 'saida', categoria: 'Tráfego', subcategoria: 'Meta Ads', valor: 8500 },
  { id: '6', data: '2025-01-25', tipo: 'saida', categoria: 'Folha', subcategoria: 'Salários', valor: 15000 },
];

export function FinanceiroView() {
  const totalEntradas = transactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Financeiro
          </h2>
          <p className="text-muted-foreground">Fluxo de caixa e movimentações</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-500">
                  R$ {totalEntradas.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-red-500">
                  R$ {totalSaidas.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {saldo.toLocaleString('pt-BR')}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
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
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {t.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{t.categoria}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {t.cliente || '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${
                      t.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}