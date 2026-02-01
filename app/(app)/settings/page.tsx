'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Input from '@/src/components/ui/Input';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface Settings {
  batchSize: number;
  autoplayAudio: boolean;
  showRomaji: boolean;
}

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>({
    batchSize: 10,
    autoplayAudio: false,
    showRomaji: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const data = await res.json();
        setUser(data.user);

        // Load settings from localStorage for now
        const savedSettings = localStorage.getItem('initialj_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const saveSettings = () => {
    setSaving(true);
    try {
      localStorage.setItem('initialj_settings', JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Settings saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 text-sm">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Account Section */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={user?.username || ''}
              disabled
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user?.role}
              </span>
              {isAdmin && (
                <span className="text-sm text-gray-500">Full access to all content</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account Status Section */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Account Status</h2>

        {isAdmin ? (
          <div className="p-4 bg-dark-50 rounded-lg border border-dark-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-dark-900 font-light uppercase tracking-wide">Admin Account</span>
            </div>
            <p className="text-sm text-dark-600 font-light">
              As an admin, you have unlimited access to all content and features.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-dark-50 rounded-lg border border-dark-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-dark-900 font-light uppercase tracking-wide">Beta Access</span>
            </div>
            <p className="text-sm text-dark-600 font-light">
              Currently in beta - all levels (N5-N1) are free. Enjoy full access to kanji and relevant vocabulary for each JLPT level.
            </p>
          </div>
        )}
      </Card>

      {/* Learning Preferences */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Learning Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Batch Size
            </label>
            <select
              value={settings.batchSize}
              onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value={5}>5 items</option>
              <option value={10}>10 items (Default)</option>
              <option value={15}>15 items</option>
              <option value={20}>20 items</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Number of new items to learn in each lesson session
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium text-gray-900">Show Romaji Hints</div>
              <div className="text-sm text-gray-500">Display romaji under hiragana readings</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, showRomaji: !settings.showRomaji })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showRomaji ? 'bg-pink-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showRomaji ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">Auto-play Audio</div>
              <div className="text-sm text-gray-500">Automatically play pronunciation audio</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoplayAudio: !settings.autoplayAudio })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoplayAudio ? 'bg-pink-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoplayAudio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <Button onClick={saveSettings} disabled={saving} fullWidth>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Submit Answer</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">Enter</kbd>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Show Answer</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">Space</kbd>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Mark Correct</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">1</kbd>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Mark Incorrect</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">2</kbd>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Burn Item</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">B</kbd>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Skip Item</span>
            <kbd className="px-2 py-1 bg-white border rounded text-xs">S</kbd>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="font-medium text-red-700 mb-1">Reset Progress</div>
            <p className="text-sm text-red-600 mb-3">
              This will permanently delete all your learning progress. This action cannot be undone.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                  // TODO: Implement progress reset
                  setMessage({ type: 'success', text: 'Progress reset (not yet implemented)' });
                }
              }}
            >
              Reset All Progress
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
