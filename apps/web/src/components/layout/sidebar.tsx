'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  Brain,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
} from 'lucide-react';

import { cn, roleLabels } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // If undefined, visible to all roles
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Organization',
    href: '/dashboard/organization',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN'], // Only for admins
  },
  {
    title: 'Kullanıcılar',
    href: '/dashboard/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN'], // Only for admins
  },
  {
    title: 'Danışanlar',
    href: '/dashboard/clients',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'RECEPTIONIST'], // Not visible to CLIENT
  },
  {
    title: 'Randevular',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Seanslar',
    href: '/dashboard/sessions',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'ADMIN', 'THERAPIST'], // Only therapists and admins can see sessions
  },
  {
    title: 'Ev Ödevleri',
    href: '/dashboard/homework',
    icon: BookOpen,
    roles: ['CLIENT'], // Only clients can see their homework
  },
  {
    title: 'Ödemeler',
    href: '/dashboard/payments',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'], // Only finance-related roles
  },
  {
    title: 'Raporlar',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN', 'THERAPIST'], // Not visible to CLIENT
  },
];

const bottomMenuItems = [
  {
    title: 'Ayarlar',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  session: Session | null;
}

export function Sidebar({ session }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const user = session?.user;
  const userRole = (user as { role?: string })?.role || 'CLIENT';
  const initials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true; // Visible to all if no roles specified
    return item.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary/20">
            <Brain className="w-6 h-6 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              PsyFlow
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary/15 text-sidebar-primary font-medium',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomMenuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary/15 text-sidebar-primary font-medium',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}

        <Separator className="my-3 bg-sidebar-border" />

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name || 'Kullanıcı'}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {roleLabels[(user as { role?: string })?.role ?? ''] || 'Kullanıcı'}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name || 'Kullanıcı'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse button */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'px-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Daralt
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

