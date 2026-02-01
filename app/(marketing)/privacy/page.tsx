import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-8">
            Privacy Policy
          </h1>
          
          <div className="space-y-8 text-lg text-dark-600 font-light leading-relaxed">
            <p className="text-sm text-dark-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">1. Introduction</h2>
              <p>
                InitialJ ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Japanese language learning platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">2. Information We Collect</h2>
              <p className="mb-4">We collect information that you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, username (optional), and password</li>
                <li><strong>Learning Progress:</strong> Your kanji and vocabulary progress, SRS stage data, and review history</li>
                <li><strong>Settings:</strong> Your learning preferences and app settings</li>
                <li><strong>Communication:</strong> Messages you send to us through contact forms or support</li>
              </ul>
              <p className="mt-4">
                We also automatically collect certain information when you use our Service:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>Usage data and analytics</li>
                <li>Device information and browser type</li>
                <li>IP address and general location data</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Track your learning progress and personalize your experience</li>
                <li>Send you verification codes, welcome emails, and important updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns to improve our Service</li>
                <li>Detect, prevent, and address technical issues</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">4. Data Storage and Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information. Your data is stored securely and we use industry-standard encryption for sensitive information such as passwords.
              </p>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">5. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you with our Service. If you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">6. Sharing Your Information</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our Service (e.g., email delivery, hosting)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:support@initialj.com" className="text-dark-900 hover:underline">
                  support@initialj.com
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our Service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">9. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our Service, you consent to the transfer of your information to our facilities and those third parties with whom we share it as described in this policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-light text-dark-900 mb-4">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
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
