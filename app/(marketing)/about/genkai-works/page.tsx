import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Link from 'next/link';

export default function GenkaiWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            Genkai Works
          </h1>
          
          <div className="space-y-8 text-lg text-dark-600 font-light leading-relaxed">
            <p>
              InitialJ is a product of <strong className="text-dark-900 font-light">Genkai Works SARL</strong>, 
              a software house based in Neuchâtel, Switzerland. We build web apps in house and provide 
              digital services to our clients.
            </p>
            
            <div className="border-t border-dark-200 pt-8">
              <h2 className="text-2xl lg:text-3xl font-light text-dark-900 mb-6">
                About Genkai Works
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-light text-dark-900 mb-3">Our Mission</h3>
                  <p className="text-dark-600 font-light">
                    Genkai Works is a software development company based in Switzerland, specialized in 
                    creating custom technological solutions. We develop various products, including InitialJ 
                    which focuses on Japanese language learning through spaced repetition.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-light text-dark-900 mb-3">Company Structure</h3>
                  <ul className="space-y-2 text-dark-600 font-light">
                    <li><strong className="text-dark-900 font-light">Company Name:</strong> Genkai Works SARL</li>
                    <li><strong className="text-dark-900 font-light">Legal Form:</strong> Société à responsabilité limitée</li>
                    <li><strong className="text-dark-900 font-light">Location:</strong> Neuchâtel, Switzerland</li>
                    <li><strong className="text-dark-900 font-light">Website:</strong> <Link href="https://genkai.works" target="_blank" rel="noopener noreferrer" className="text-dark-900 hover:underline">genkai.works</Link></li>
                    <li><strong className="text-dark-900 font-light">Email:</strong> <Link href="mailto:info@genkai.works" className="text-dark-900 hover:underline">info@genkai.works</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-light text-dark-900 mb-3">Our Products</h3>
                  <ul className="space-y-3 text-dark-600 font-light">
                    <li>
                      <strong className="text-dark-900 font-light">InitialJ:</strong> Japanese kanji and vocabulary 
                      learning platform with spaced repetition system, covering all JLPT levels
                    </li>
                    <li>
                      <strong className="text-dark-900 font-light">WebClinic.ch:</strong> Healthcare websites in Switzerland 
                      - SEO-optimized, GDPR-compliant websites with secure hosting and maintenance
                    </li>
                    <li>
                      <strong className="text-dark-900 font-light">MG Maison Genkai:</strong> Premium Japanese Crafts - 
                      Swiss-based brand curating authentic Japanese craftsmanship
                    </li>
                    <li>
                      <strong className="text-dark-900 font-light">Custom Solutions:</strong> Development of personalized applications
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-light text-dark-900 mb-3">Transparency and Trust</h3>
                  <p className="text-dark-600 font-light">
                    We believe in transparency and are committed to maintaining the trust of our users. 
                    All our information is public and accessible, and we comply with all Swiss and European regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-200 pt-8">
              <h2 className="text-2xl lg:text-3xl font-light text-dark-900 mb-6">
                Contact
              </h2>
              <p className="text-dark-600 font-light mb-4">
                Have questions about Genkai Works or InitialJ? We're transparent and available to answer all your questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="mailto:info@genkai.works"
                  className="text-dark-900 hover:underline font-light"
                >
                  Contact Us
                </Link>
                <Link 
                  href="https://genkai.works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-900 hover:underline font-light"
                >
                  Visit Genkai Works →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
