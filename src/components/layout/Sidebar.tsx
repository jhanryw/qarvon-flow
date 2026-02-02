import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  FileText, 
  Target,
  DollarSign,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Inbox,
  Radio,
  LogOut,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
  isAdmin?: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox Unificado', icon: Inbox },
  { id: 'canais', label: 'Configurar Canais', icon: Radio },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'cadencias', label: 'Cadências', icon: MessageSquare },
  { id: 'objecoes', label: 'Matriz de Objeções', icon: Target },
  { id: 'scripts', label: 'Scripts', icon: FileText },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

const adminMenuItems = [
  { id: 'usuarios', label: 'Gerenciar Usuários', icon: UserCog },
];

export function Sidebar({ activeModule, onModuleChange, userName, userEmail, onSignOut, isAdmin }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">Qarvon</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent group",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-primary"
              )} />
              {!collapsed && (
                <span className={cn(
                  "font-medium text-sm truncate",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin-only menu items */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              {!collapsed && (
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onModuleChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent group",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-primary"
                  )} />
                  {!collapsed && (
                    <span className={cn(
                      "font-medium text-sm truncate",
                      isActive && "text-primary"
                    )}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
            {userName?.charAt(0).toUpperCase() || 'Q'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || ''}</p>
            </div>
          )}
        </div>
        {!collapsed && onSignOut && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-muted-foreground hover:text-foreground"
            onClick={onSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        )}
      </div>
    </aside>
  );
}
