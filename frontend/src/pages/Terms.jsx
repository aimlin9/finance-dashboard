import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
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

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-400">
              By accessing and using FinTrack Ghana, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-gray-400">
              FinTrack Ghana is a personal finance dashboard that allows users to upload bank statements, automatically categorize transactions, view spending analytics, and receive AI-generated financial insights. The service is provided as-is for personal use.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
            <p className="text-gray-400">
              You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating your account. You are solely responsible for all activity under your account.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="text-gray-400">
              You agree to use FinTrack Ghana only for lawful purposes. You must not upload files containing malicious content, attempt to access other users' data, or use the service to conduct any fraudulent activity.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">5. Financial Disclaimer</h2>
            <p className="text-gray-400">
              FinTrack Ghana is a personal finance tracking tool, not a licensed financial advisor. AI-generated insights are for informational purposes only and should not be considered professional financial advice. Always consult a qualified financial advisor for important financial decisions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Accuracy</h2>
            <p className="text-gray-400">
              While we strive for accurate transaction parsing and categorization, we cannot guarantee 100% accuracy. Users should verify their transaction data and categories. The NLP categorization system achieves approximately 90% accuracy.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">7. Service Availability</h2>
            <p className="text-gray-400">
              We aim to keep the service available at all times but do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance or updates.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-400">
              FinTrack Ghana is provided as-is without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p className="text-gray-400">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
