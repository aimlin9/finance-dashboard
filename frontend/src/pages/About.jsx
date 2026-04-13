import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Mail, Globe } from 'lucide-react';

export default function About() {
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

        <h1 className="text-3xl font-bold text-white mb-8">About FinTrack Ghana</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">The Problem</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Most Ghanaians have no clear picture of where their money goes. Bank apps show raw transactions — numbers, dates, and cryptic reference codes — but offer zero analysis. No categories. No charts. No insights.
          </p>
          <p className="text-gray-400 leading-relaxed">
            There is no tool that reads a GCB or MTN MoMo statement and tells you in plain language what your money is doing and what to change. FinTrack Ghana was built to fill that gap.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">The Solution</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            FinTrack Ghana is a full-stack personal finance dashboard that automatically parses Ghanaian bank statements, categorizes every transaction using NLP, and delivers AI-powered spending insights. Upload a statement and within seconds see exactly where your money went.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-indigo-400 font-medium text-sm mb-1">5 Banks Supported</p>
              <p className="text-gray-500 text-sm">GCB, Ecobank, MTN MoMo, Absa, Fidelity</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-emerald-400 font-medium text-sm mb-1">9 Categories</p>
              <p className="text-gray-500 text-sm">Food, Transport, Utilities, Health, and more</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-amber-400 font-medium text-sm mb-1">90% Accuracy</p>
              <p className="text-gray-500 text-sm">Keyword rules + spaCy NLP classifier</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-cyan-400 font-medium text-sm mb-1">AI Insights</p>
              <p className="text-gray-500 text-sm">Google Gemini 2.5 Flash for personalized advice</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-3">
            {['Python', 'Django', 'React', 'Tailwind CSS', 'PostgreSQL', 'spaCy', 'Google Gemini', 'JWT Auth', 'Recharts', 'pdfplumber'].map(function(tech) {
              return (
                <span key={tech} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm">
                  {tech}
                </span>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Built By</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              G
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Gyimah Ramsey Opoku</p>
              <p className="text-gray-500">Computer Science Student, Accra, Ghana</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            CS student passionate about building software that solves real problems for African markets. Currently seeking remote internship opportunities in full-stack development.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/aimlin9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm"
            >
              <ExternalLink size={16} />
              GitHub
            </a>
            <a
              href="https://dev.to/aimlin9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm"
            >
              <Globe size={16} />
              Dev.to
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
