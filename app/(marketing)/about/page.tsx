import Link from 'next/link';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            About InitialJ
          </h1>
          
          <div className="space-y-8 text-lg text-dark-600 font-light leading-relaxed">
            <p>
              InitialJ is a Japanese learning platform designed to help you master kanji and relevant vocabulary 
              for each JLPT level through scientifically-proven spaced repetition. We believe in making Japanese 
              learning accessible, effective, and enjoyable.
            </p>
            
            <p>
              Our platform uses the Spaced Repetition System (SRS) to ensure you remember what you learn. 
              Each kanji and vocabulary word is presented at optimal intervals, helping you build long-term 
              memory retention. The vocabulary is carefully selected to be relevant for each section of the JLPT exams.
            </p>
            
            <p>
              Currently in beta, InitialJ is free for all users. We're continuously improving the platform 
              based on user feedback to provide the best learning experience possible.
            </p>

            <div className="border-t border-dark-200 pt-8 mt-8">
              <p className="text-dark-600 font-light mb-4">
                InitialJ is a product of <strong className="text-dark-900 font-light">Genkai Works SARL</strong>, 
                a software house based in Neuchâtel, Switzerland.
              </p>
              <Link 
                href="/about/genkai-works"
                className="text-dark-900 hover:underline font-light"
              >
                Learn more about Genkai Works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
