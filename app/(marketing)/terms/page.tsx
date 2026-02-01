import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            Terms of Service
          </h1>
          
          <div className="space-y-8 text-lg text-dark-600 font-light leading-relaxed">
            <p className="text-sm text-dark-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using InitialJ ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">2. Description of Service</h2>
              <p>
                InitialJ is a Japanese language learning platform that helps users master kanji and vocabulary through spaced repetition. The Service is currently in beta and all features are provided free of charge during this period.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">3. User Accounts</h2>
              <p>
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information to keep it accurate</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">4. Beta Service</h2>
              <p>
                InitialJ is currently in beta. During this period:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>All features are provided free of charge</li>
                <li>The Service may be subject to changes, updates, or discontinuation</li>
                <li>We may introduce pricing or subscription models after the beta period</li>
                <li>Users will be notified in advance of any changes to pricing or service availability</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">5. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Share your account credentials with others</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the property of InitialJ or its licensors and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">7. Limitation of Liability</h2>
              <p>
                InitialJ is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free. You use the Service at your own risk.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">8. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:support@initialj.com" className="text-dark-900 hover:underline">
                  support@initialj.com
                </a>
              </p>
            </div>

            <div className="border-t border-dark-200 pt-8 mt-8">
              <p className="text-sm text-dark-500">
                InitialJ is a product of Genkai Works SARL, a software house based in Neuchâtel, Switzerland.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
