import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CRMPipeline } from '@/components/crm/CRMPipeline';
import OperacionalView from '@/components/operacional/OperacionalView';
import { CadenceFlow } from '@/components/cadencias/CadenceFlow';
import { ObjectionMatrix } from '@/components/objecoes/ObjectionMatrix';
import { ScriptsView } from '@/components/scripts/ScriptsView';
import { FinanceiroView } from '@/components/financeiro/FinanceiroView';
import { AgendaView } from '@/components/agenda/AgendaView';
import { ConfiguracoesView } from '@/components/configuracoes/ConfiguracoesView';
import { UnifiedInbox } from '@/components/inbox/UnifiedInbox';
import { ChannelSettings } from '@/components/inbox/ChannelSettings';
import { UserManagement } from '@/components/configuracoes/UserManagement';
import { useAuth } from '@/contexts/AuthContext';

const moduleConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral da agência' },
  inbox: { title: 'Inbox Unificado', subtitle: 'WhatsApp + Instagram' },
  canais: { title: 'Configurar Canais', subtitle: 'WhatsApp e Instagram por vendedor' },
  crm: { title: 'CRM', subtitle: 'Gestão de leads e pipeline' },
  operacional: { title: 'Operacional', subtitle: 'Kanban e calendário por cliente' },
  cadencias: { title: 'Cadências', subtitle: 'Fluxos de abordagem' },
  objecoes: { title: 'Matriz de Objeções', subtitle: 'Respostas para objeções' },
  scripts: { title: 'Scripts', subtitle: 'Roteiros de vendas' },
  financeiro: { title: 'Financeiro', subtitle: 'Fluxo de caixa' },
  agenda: { title: 'Agenda', subtitle: 'Compromissos e eventos' },
  configuracoes: { title: 'Configurações', subtitle: 'Preferências do sistema' },
  usuarios: { title: 'Usuários', subtitle: 'Gerenciar equipe e permissões' },
};

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const { profile, signOut, isAdmin } = useAuth();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'inbox':
        return <UnifiedInbox />;
      case 'canais':
        return <ChannelSettings />;
      case 'crm':
        return <CRMPipeline />;
      case 'operacional':
        return <OperacionalView />;
      case 'cadencias':
        return <CadenceFlow />;
      case 'objecoes':
        return <ObjectionMatrix />;
      case 'scripts':
        return <ScriptsView />;
      case 'financeiro':
        return <FinanceiroView />;
      case 'agenda':
        return <AgendaView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      case 'usuarios':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  const config = moduleConfig[activeModule] || moduleConfig.dashboard;

  return (
    <div className="flex h-screen bg-background dark">
      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
        userName={profile?.nome}
        userEmail={profile?.email}
        onSignOut={signOut}
        isAdmin={isAdmin()}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={config.title} subtitle={config.subtitle} />
        <main className="flex-1 overflow-auto">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default Index;
