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

  if (!user || pathname === '/') return null

  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 p-3 rounded-xl border border-border bg-card shadow-lg">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all
              ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <Icon className="h-5 w-5" />

            {/* Tooltip */}
            <div className="absolute left-14 px-3 py-2 rounded-lg bg-popover border border-border text-popover-foreground text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg">
              {item.name}
            </div>
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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/icon.png" alt="ATS logo" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-foreground text-xl">ATS</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:block text-sm font-medium text-foreground">
                {user.displayName || 'User'}
              </div>
              <UserButton />
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/handler/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/handler/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
