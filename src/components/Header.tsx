'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                IT Blog
              </span>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm">
              IT
            </div>
            <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
              Blog
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" label="Home" />
            <NavLink href="/reading-list" label="Reading List" />
            <NavLink href="/feed.xml" label="RSS" external />
            
            <div className="h-4 w-px bg-border mx-2" />
            
            {session ? (
              <>
                <NavLink href="/admin" label="Dashboard" />
                <button 
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-error hover:bg-error/10 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink href="/auth/signin" label="Sign In" />
            )}
            
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border space-y-1">
            <MobileNavLink href="/" label="Home" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/reading-list" label="Reading List" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/feed.xml" label="RSS" external onClick={() => setIsMenuOpen(false)} />
            
            {session ? (
              <>
                <MobileNavLink href="/admin" label="Dashboard" onClick={() => setIsMenuOpen(false)} />
                <button 
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut()
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-error hover:bg-error/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <MobileNavLink href="/auth/signin" label="Sign In" onClick={() => setIsMenuOpen(false)} />
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <Link 
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, external = false, onClick }: { href: string; label: string; external?: boolean; onClick: () => void }) {
  return (
    <Link 
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {label}
    </Link>
  )
}
