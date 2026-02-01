import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-dark-200 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Shop */}
          <div>
            <h3 className="text-sm font-light text-dark-900 mb-4 uppercase tracking-wide">Learn</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/lessons" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Lessons
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-light text-dark-900 mb-4 uppercase tracking-wide">About</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/about/genkai-works" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Genkai Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Help */}
          <div>
            <h3 className="text-sm font-light text-dark-900 mb-4 uppercase tracking-wide">Get Help</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Learning Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-light text-dark-900 mb-4 uppercase tracking-wide">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-dark-600 hover:text-dark-900 font-light text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div 
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 100%)' }}
            >
              <span className="text-white font-light text-lg">J</span>
            </div>
            <span 
              className="text-lg font-light tracking-tight bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 50%, #1F2922 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-animate 3s ease infinite'
              }}
            >
              InitialJ
            </span>
          </div>
          <div className="text-sm text-dark-500 font-light">
            © {new Date().getFullYear()} InitialJ by{' '}
            <Link 
              href="/about/genkai-works" 
              className="text-dark-900 hover:underline font-light"
            >
              Genkai Works SARL
            </Link>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
