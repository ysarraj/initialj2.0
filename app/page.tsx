import Header from '@/src/components/layout/Header';
import Button from '@/src/components/ui/Button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-broken-50 to-broken-100">
      <Header />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="font-title text-4xl md:text-6xl font-bold text-dark-800 mb-6">
            Import de Voitures JDM
            <span className="block text-vermillion-500">Authentiques</span>
          </h1>
          
          <p className="text-xl text-dark-600 mb-8 max-w-3xl mx-auto">
            Découvrez notre sélection exclusive de véhicules japonais importés directement 
            du Japon. Qualité garantie, authenticité vérifiée.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vehicles">
              <Button size="lg">Explorer les véhicules</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">En savoir plus</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-dark-200">
            <div className="w-12 h-12 bg-vermillion-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-vermillion-500 text-2xl">🚗</span>
            </div>
            <h3 className="font-semibold text-lg text-dark-800 mb-2">Véhicules Authentiques</h3>
            <p className="text-dark-600">Importation directe du Japon avec certificats d'authenticité</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-dark-200">
            <div className="w-12 h-12 bg-vermillion-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-vermillion-500 text-2xl">✅</span>
            </div>
            <h3 className="font-semibold text-lg text-dark-800 mb-2">Qualité Vérifiée</h3>
            <p className="text-dark-600">Inspection complète et remise en état par nos experts</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-dark-200">
            <div className="w-12 h-12 bg-vermillion-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-vermillion-500 text-2xl">🛡️</span>
            </div>
            <h3 className="font-semibold text-lg text-dark-800 mb-2">Service Complet</h3>
            <p className="text-dark-600">Accompagnement de A à Z pour votre import</p>
          </div>
        </div>
      </section>
    </main>
  );
}
