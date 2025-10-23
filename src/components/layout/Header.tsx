'use client';

import Link from 'next/link';
import Button from '@/src/components/ui/Button';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-dark-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-vermillion-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <span className="font-title text-xl font-bold text-dark-800">InitialJ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/vehicles" className="text-dark-700 hover:text-vermillion-500 transition-colors">
              Véhicules
            </Link>
            <Link href="/about" className="text-dark-700 hover:text-vermillion-500 transition-colors">
              À propos
            </Link>
            <Link href="/contact" className="text-dark-700 hover:text-vermillion-500 transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>S'inscrire</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-dark-700 hover:text-vermillion-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-dark-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link href="/vehicles" className="text-dark-700 hover:text-vermillion-500">Véhicules</Link>
              <Link href="/about" className="text-dark-700 hover:text-vermillion-500">À propos</Link>
              <Link href="/contact" className="text-dark-700 hover:text-vermillion-500">Contact</Link>
              <div className="pt-4 border-t border-dark-200 space-y-2">
                <Link href="/login">
                  <Button variant="ghost" className="w-full">Connexion</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full">S'inscrire</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
