"use client"

import { useDesignConfig } from '@/hooks/useDesignConfig';
import { StudioType } from '@/types/studio';
import { Home, Building2, Trees, ChevronDown, Globe, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const studioTypes: { type: StudioType; name: string; path: string; icon: React.ReactNode }[] = [
  { type: 'interior', name: 'Interior', path: '/studio/interior', icon: <Home className="w-4 h-4" /> },
  { type: 'exterior', name: 'Exterior', path: '/studio/exterior', icon: <Building2 className="w-4 h-4" /> },
  { type: 'landscape', name: 'Landscape', path: '/studio/landscape', icon: <Trees className="w-4 h-4" /> }
];

const navLinks = [
  { name: 'Studio', path: '/studio' },
  { name: 'My Projects', path: '/studio/projects' },
  { name: 'Subscription', path: '/subscription' }
];

interface GlobalHeaderProps {
  demoMode?: boolean;
}

export function GlobalHeader({ demoMode }: GlobalHeaderProps = {}) {
  const { config, setActiveStudio } = useDesignConfig();
  const pathname = usePathname();
  const router = useRouter();
  const { user, openLoginModal } = useAuth();
  const links = demoMode ? navLinks.filter((l) => l.path === '/studio') : navLinks;

  const handleLogOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/")
    router.refresh()
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Left: Studio Mode Toggle */}
          <div className="flex items-center">
            <div className="bg-muted p-1 rounded-full flex items-center gap-1">
              {studioTypes.map(({ type, name, path, icon }) => (
                <Link
                  key={type}
                  href={demoMode ? `${path}?demo=true` : path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    pathname?.startsWith(path)
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveStudio(type)}
                >
                  {icon}
                  <span className="text-sm font-medium">{name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-8">
            {links.map(({ name, path }) => (
              <Link
                key={path}
                href={path}
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith(path)
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Right: Language & Profile / Login */}
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Globe className="w-4 h-4" />
                EN
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>Español</DropdownMenuItem>
                <DropdownMenuItem>Français</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{(user.email?.[0] ?? user.user_metadata?.name?.[0] ?? 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.user_metadata?.name ?? user.email ?? 'Account'}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLogOut()}>Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => openLoginModal(pathname ?? '/studio/interior')}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
} 