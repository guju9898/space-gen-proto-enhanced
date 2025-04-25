"use client"

import { useDesignConfig } from '@/hooks/useDesignConfig';
import { StudioType } from '@/types/studio';
import { Home, Building2, Trees, ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  { name: 'My Projects', path: '/projects' },
  { name: 'Subscription', path: '/subscription' }
];

export function GlobalHeader() {
  const { config, setActiveStudio } = useDesignConfig();
  const pathname = usePathname();

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
                  href={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    pathname.startsWith(path)
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
            {navLinks.map(({ name, path }) => (
              <Link
                key={path}
                href={path}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(path)
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Right: Language & Profile */}
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

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/martin.jpg" />
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Martin</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  );
} 