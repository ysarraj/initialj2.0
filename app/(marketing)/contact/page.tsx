'use client';

import { useState } from 'react';
import Header from '@/src/components/layout/Header';
import Footer from '@/src/components/layout/Footer';
import Button from '@/src/components/ui/Button';
import Input from '@/src/components/ui/Input';
import Card from '@/src/components/ui/Card';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-4">
              Contact Support
            </h1>
            <p className="text-lg text-dark-600 font-light">
              Have a question or need help? We're here to assist you.
            </p>
          </div>

          <Card>
            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-light text-dark-900 mb-4">
                  Message Sent Successfully
                </h2>
                <p className="text-dark-600 font-light mb-6">
                  Thank you for contacting us. We'll get back to you as soon as possible.
                </p>
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setError('');
                  }}
                  variant="secondary"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    fullWidth
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    fullWidth
                  />
                </div>

                <Input
                  label="Subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this regarding?"
                  required
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-light text-dark-900 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help..."
                    required
                    rows={6}
                    className="w-full px-4 py-2.5 text-sm border rounded-xl bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-dark-900 focus:border-dark-900 focus:scale-[1.01] placeholder:text-dark-400 font-light resize-none"
                  />
                </div>

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Send Message
                </Button>
              </form>
            )}
          </Card>

          <div className="mt-12 text-center">
            <p className="text-dark-600 font-light mb-4">
              You can also reach us directly at:
            </p>
            <a
              href="mailto:support@initialj.com"
              className="text-dark-900 hover:underline font-light text-lg"
            >
              support@initialj.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
