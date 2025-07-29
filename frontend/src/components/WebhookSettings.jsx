import React, { useState, useEffect } from 'react';
import { Settings, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const WebhookSettings = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchWebhookSettings();
  }, []);

  const fetchWebhookSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tracker/profile', {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      setWebhookUrl(response.data.webhookUrl || '');
    } catch (error) {
      console.error('Error fetching webhook settings:', error);
      toast.error('Failed to fetch webhook settings');
    } finally {
      setLoading(false);
    }
  };

  const saveWebhook = async (e) => {
    e.preventDefault();
    
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    try {
      setSaving(true);
      await axios.put('/api/tracker/webhook', { webhookUrl }, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      
      toast.success('Webhook URL saved successfully');
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook URL');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL first');
      return;
    }

    try {
      setTesting(true);
      await axios.post('/api/tracker/webhook/test', { webhookUrl }, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      
      toast.success('Test message sent successfully! Check your Discord channel.');
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to send test message');
    } finally {
      setTesting(false);
    }
  };

  const validateWebhookUrl = (url) => {
    const discordWebhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return discordWebhookPattern.test(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discord Webhook Settings
          </h3>
        </div>

        <form onSubmit={saveWebhook} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discord Webhook URL
            </label>
            <div className="flex space-x-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={saving || !webhookUrl.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
            
            {webhookUrl && (
              <div className="mt-2 flex items-center space-x-2">
                {validateWebhookUrl(webhookUrl) ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Valid Discord webhook URL
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      Please enter a valid Discord webhook URL
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={testWebhook}
              disabled={testing || !webhookUrl.trim() || !validateWebhookUrl(webhookUrl)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {testing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>{testing ? 'Testing...' : 'Test Webhook'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How to set up Discord webhook:
        </h4>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Go to your Discord server settings</li>
          <li>Navigate to Integrations → Webhooks</li>
          <li>Click "New Webhook" and give it a name</li>
          <li>Copy the webhook URL and paste it above</li>
          <li>Save the settings and test the webhook</li>
        </ol>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          What you'll receive:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• BuyBox change notifications (gains/losses)</li>
          <li>• Estimated sales alerts when stock decreases</li>
          <li>• System status updates and error notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default WebhookSettings; 