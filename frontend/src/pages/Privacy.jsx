import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  var navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 px-6 sm:px-12 py-12">
      <div className="max-w-3xl mx-auto">
        <div
          onClick={function() { navigate(-1); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="text-gray-400">
              We collect information you provide directly when creating your account, including your email address, display name, currency preference, and timezone. When you upload bank statements, the system processes transaction data to provide spending analysis. We do not store raw bank statement files permanently.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p className="text-gray-400">
              Your data is used to maintain your account, parse and categorize your transactions, compute spending summaries, generate AI-powered financial insights, and display your dashboard. Transaction data is only accessible to you through authenticated API requests.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">3. AI Processing</h2>
            <p className="text-gray-400">
              When you request AI insights, aggregated spending summary data (not individual transactions) is sent to Google Gemini to generate personalized financial advice. No personally identifiable information such as your name, email, or account numbers is included in these requests.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cookies and Local Storage</h2>
            <p className="text-gray-400">
              We use browser local storage to maintain your authentication session (JWT tokens) and remember your theme preference. We do not use third-party tracking cookies or analytics services.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">5. Information Sharing</h2>
            <p className="text-gray-400">
              We do not sell, rent, or share your personal data with third parties. Your financial data is private and only accessible through your authenticated account.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Security</h2>
            <p className="text-gray-400">
              We implement industry-standard security measures including password hashing, JWT token authentication with automatic expiry, and CORS protection. All API endpoints require authentication except registration and login.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Deletion</h2>
            <p className="text-gray-400">
              You can delete individual bank statements and their associated transactions at any time through the History page. To delete your entire account, please contact us.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
            <p className="text-gray-400">
              For privacy-related questions, reach out via GitHub at{' '}
              <a href="https://github.com/aimlin9" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                github.com/aimlin9
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
