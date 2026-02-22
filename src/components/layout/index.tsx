"use client"

import { UserButton,useUser } from '@stackframe/stack'
import {
  BarChart3,
  Clock,
  FileCode2,
  FileEdit,
  LayoutDashboard,
  Menu,
  Upload,
  X} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'Analysis', href: '/dashboard/analysis', icon: BarChart3 },
  { name: 'Cover Letter', href: '/dashboard/cover-letter', icon: FileEdit },
  { name: 'Resume Builder', href: '/dashboard/resume-builder', icon: FileCode2 },
  { name: 'History', href: '/dashboard/history', icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useUser()

  // Only show sidebar when logged in and NOT on the landing page
  if (!user || pathname === '/') return null

  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 p-2 rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-2xl shadow-border/10/50">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
              ${isActive
                ? 'bg-primary text-white shadow-lg shadow-muted-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <Icon className="h-5 w-5" />

            {/* Tooltip */}
            <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl">
              {item.name}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
            </div>

            {isActive && (
              <div className="absolute -left-2 w-1 h-6 bg-primary rounded-full" />
            )}
          </Link>
        )
      })}
    </aside>
  )
}

export function TopNav() {
  const user = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full bg-card/60 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/icon.png" alt="ATS logo" width={30} height={30} className="rounded-lg object-contain shadow-sm group-hover:scale-105 transition-transform" />
            <span className="font-black text-foreground tracking-tighter text-xl">ATS</span>
          </Link>

          {/* Desktop Nav - Breadcrumb style */}
          {user && pathname !== '/' && (
            <nav className="hidden lg:flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <span className="opacity-30">/</span>
              <span className="text-foreground capitalize">
                {pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-xs font-bold text-foreground leading-none mb-1">
                  {user.displayName || 'User'}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Personal Account
                </span>
              </div>
              <div className="p-1 rounded-full bg-background border border-border">
                <UserButton />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/handler/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/handler/signup">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold shadow-lg shadow-border/10 transition-all active:scale-95">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-card border-b border-border p-4 animate-slide-up shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-2xl transition-all
                      ${isActive
                        ? 'bg-primary text-white shadow-xl shadow-muted-foreground'
                        : 'text-muted-foreground bg-background hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
