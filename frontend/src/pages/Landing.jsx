import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Upload, Brain, BarChart3, Shield, Zap, Globe, ArrowRight, ChevronDown } from 'lucide-react';
import Logo from '../components/Logo';
import useAuthStore from '../store/authStore';


var sampleData = [
  { name: 'Food', value: 30, color: '#10B981' },
  { name: 'Transport', value: 15, color: '#6366F1' },
  { name: 'Utilities', value: 45, color: '#F59E0B' },
  { name: 'Savings', value: 300, color: '#64748B' },
];

var sampleTransactions = [
  { desc: 'KFC Ostamel Branch', cat: 'Food', amount: '30.00', color: '#10B981' },
  { desc: 'Uber Trip Accra', cat: 'Transport', amount: '15.00', color: '#6366F1' },
  { desc: 'ECG Prepaid', cat: 'Utilities', amount: '45.00', color: '#F59E0B' },
  { desc: 'Salary Payment', cat: 'Income', amount: '450.00', color: '#22D3EE' },
];

function useOnScreen(ref) {
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    var observer = new IntersectionObserver(
      function(entries) {
        if (entries[0].isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return function() {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref]);

  return visible;
}

function AnimatedSection({ children, delay }) {
  var ref = useRef(null);
  var visible = useOnScreen(ref);
  var d = delay || 0;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.7s ease ' + d + 's, transform 0.7s ease ' + d + 's',
      }}
    >
      {children}
    </div>
  );
}

function CountUp({ target, duration }) {
  var [count, setCount] = useState(0);
  var ref = useRef(null);
  var visible = useOnScreen(ref);

  useEffect(function() {
    if (!visible) return;
    var end = target;
    var dur = duration || 2000;
    var startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / dur, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [visible, target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function Landing() {
  var navigate = useNavigate();
  var [activeTransaction, setActiveTransaction] = useState(0);

  var { isAuthenticated } = useAuthStore();

  useEffect(function() {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(function() {
    var interval = setInterval(function() {
      setActiveTransaction(function(prev) {
        return (prev + 1) % sampleTransactions.length;
      });
    }, 2000);
    return function() { clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Animated background gradient */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6" style={{ animation: 'fadeDown 0.6s ease' }}>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-xl font-bold text-white">FinTrack</h1>
        </div>
        <div className="flex gap-3">
          <div
            onClick={function() { navigate('/login'); }}
            className="px-5 py-2 text-gray-400 hover:text-white transition text-sm cursor-pointer"
          >
            Sign In
          </div>
          <div
            onClick={function() { navigate('/login'); }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm cursor-pointer hover:shadow-lg hover:shadow-indigo-500/25"
          >
            Get Started
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div
              className="inline-block px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-full mb-6"
              style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}
            >
              Built for Ghanaian Banks
            </div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style={{ animation: 'fadeUp 0.6s ease 0.4s both' }}
            >
              Know exactly where your
              <span className="text-indigo-400"> money goes</span>
            </h2>
            <p
              className="text-gray-400 text-lg mb-8 max-w-lg"
              style={{ animation: 'fadeUp 0.6s ease 0.6s both' }}
            >
              Upload your GCB, Ecobank, or MTN MoMo statement. Get automatic categorization, spending charts, and AI-powered financial advice in seconds.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4"
              style={{ animation: 'fadeUp 0.6s ease 0.8s both' }}
            >
              <div
                onClick={function() { navigate('/login'); }}
                className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition text-lg cursor-pointer hover:shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                Start for Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <a
                href="https://github.com/aimlin9/finance-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition text-lg text-center hover:shadow-lg"
              >
                View on GitHub
              </a>
            </div>
          </div>

          {/* Animated Dashboard Preview */}
          <div
            className="flex-1 w-full max-w-md"
            style={{ animation: 'fadeLeft 0.8s ease 0.6s both' }}
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">March 2026</p>
                  <p className="text-2xl font-bold text-white">GHS 390.00</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  13.3% saved
                </div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sampleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {sampleData.map(function(entry, index) {
                      return <Cell key={index} fill={entry.color} />;
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {sampleData.map(function(entry) {
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-gray-400">{entry.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-800 pt-3 mt-2">
                <p className="text-xs text-gray-600 mb-2">Recent Transactions</p>
                {sampleTransactions.map(function(tx, i) {
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 transition-all duration-500"
                      style={{
                        opacity: activeTransaction === i ? 1 : 0.4,
                        transform: activeTransaction === i ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.color }} />
                        <span className="text-xs text-gray-300">{tx.desc}</span>
                      </div>
                      <span className="text-xs text-gray-500">GHS {tx.amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-16" style={{ animation: 'bounce 2s ease infinite' }}>
          <ChevronDown size={24} className="text-gray-600" />
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 sm:px-12 py-12">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white"><CountUp target={5} duration={1500} /></p>
              <p className="text-sm text-gray-500">Banks Supported</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white"><CountUp target={9} duration={1500} /></p>
              <p className="text-sm text-gray-500">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white"><CountUp target={90} duration={2000} />%</p>
              <p className="text-sm text-gray-500">Auto-Categorized</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white"><CountUp target={29} duration={2000} /></p>
              <p className="text-sm text-gray-500">Unit Tests</p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 sm:px-12 py-16 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">How It Works</h3>
            <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">Three simple steps to understand your spending</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600/30 group-hover:scale-110 transition-all duration-300">
                  <Upload size={28} className="text-indigo-400" />
                </div>
                <div className="text-xs text-indigo-400 font-medium mb-2">STEP 1</div>
                <h4 className="text-lg font-semibold text-white mb-2">Upload Statement</h4>
                <p className="text-gray-400 text-sm">Drag and drop your bank statement PDF or CSV. We support GCB, Ecobank, MTN MoMo, Absa, and Fidelity.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-600/30 group-hover:scale-110 transition-all duration-300">
                  <Brain size={28} className="text-emerald-400" />
                </div>
                <div className="text-xs text-emerald-400 font-medium mb-2">STEP 2</div>
                <h4 className="text-lg font-semibold text-white mb-2">Auto Categorize</h4>
                <p className="text-gray-400 text-sm">Our NLP engine reads each transaction and categorizes it automatically. Food, transport, utilities, and more.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <div className="text-center group">
                <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-600/30 group-hover:scale-110 transition-all duration-300">
                  <BarChart3 size={28} className="text-amber-400" />
                </div>
                <div className="text-xs text-amber-400 font-medium mb-2">STEP 3</div>
                <h4 className="text-lg font-semibold text-white mb-2">Get Insights</h4>
                <p className="text-gray-400 text-sm">See spending charts, set budgets, and get personalized AI advice on how to save more.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 sm:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">Built Different</h3>
            <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">Not another generic finance app. This one speaks your language.</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedSection delay={0.1}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-default group">
                <Globe size={22} className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">Ghana-First</h4>
                <p className="text-gray-400 text-sm">Built specifically for Ghanaian bank formats. Not a foreign tool adapted — built from scratch for you.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-default group">
                <Brain size={22} className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">Smart NLP</h4>
                <p className="text-gray-400 text-sm">Trained on Ghanaian transaction data. Knows what Shoprite, trotro, and ECG prepaid mean.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-default group">
                <Zap size={22} className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">AI Insights</h4>
                <p className="text-gray-400 text-sm">Google Gemini analyzes your spending and gives specific, actionable advice in plain English.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 cursor-default group">
                <Shield size={22} className="text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">Private and Secure</h4>
                <p className="text-gray-400 text-sm">Your data stays on the server. No third-party tracking. JWT authentication keeps your account safe.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.5}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-default group">
                <BarChart3 size={22} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">Budget Tracking</h4>
                <p className="text-gray-400 text-sm">Set monthly budgets per category. Get alerts when you hit 80% or exceed your limit.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.6}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-default group">
                <Upload size={22} className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-white font-semibold mb-2">Zero Manual Entry</h4>
                <p className="text-gray-400 text-sm">Upload once, see everything. No typing transactions by hand. The parser does all the work.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* AI Preview */}
      <section className="relative z-10 px-6 sm:px-12 py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">AI That Actually Helps</h3>
              <p className="text-gray-500 max-w-lg mx-auto">Not generic tips. Real advice based on your actual spending numbers.</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-500">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-indigo-400" />
                <span className="text-sm text-indigo-400 font-medium">AI Financial Insight — March 2026</span>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>Your essential expenses for food (GHS 30), transport (GHS 15), and utilities (GHS 45) are impressively low and well-managed. This demonstrates excellent discipline.</p>
                <p>Consider automating a transfer of GHS 100-150 directly into a dedicated savings account each payday to prioritize your financial growth.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 sm:px-12 py-20">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to take control of your money?</h3>
            <p className="text-gray-400 mb-8 text-lg">Free to use. No credit card required. Upload your first statement in under a minute.</p>
            <div
              onClick={function() { navigate('/login'); }}
              className="group inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition text-lg cursor-pointer hover:shadow-xl hover:shadow-indigo-500/25"
            >
              Get Started Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">FinTrack Ghana</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                A personal finance dashboard built for Ghanaian banks. Upload your statement, understand your spending.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <div className="space-y-2">
                <a href="https://github.com/aimlin9/finance-dashboard" target="_blank" rel="noopener noreferrer" className="block text-gray-500 hover:text-gray-300 text-sm transition">GitHub</a>
                <a href="https://dev.to/aimlin9" target="_blank" rel="noopener noreferrer" className="block text-gray-500 hover:text-gray-300 text-sm transition">Dev.to Blog</a>
                <div onClick={function() { navigate('/login'); }} className="text-gray-500 hover:text-gray-300 text-sm transition cursor-pointer">Sign In</div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <div onClick={function() { navigate('/about'); }} className="text-gray-500 hover:text-gray-300 text-sm transition cursor-pointer">About Us</div>
                <div onClick={function() { navigate('/privacy'); }} className="text-gray-500 hover:text-gray-300 text-sm transition cursor-pointer">Privacy Policy</div>
                <div onClick={function() { navigate('/terms'); }} className="text-gray-500 hover:text-gray-300 text-sm transition cursor-pointer">Terms of Service</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">&copy; 2026 FinTrack Ghana. All rights reserved.</p>
            <p className="text-gray-600 text-sm">Built by Gyimah Ramsey Opoku</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{"\
        @keyframes fadeUp {\
          from { opacity: 0; transform: translateY(30px); }\
          to { opacity: 1; transform: translateY(0); }\
        }\
        @keyframes fadeDown {\
          from { opacity: 0; transform: translateY(-20px); }\
          to { opacity: 1; transform: translateY(0); }\
        }\
        @keyframes fadeLeft {\
          from { opacity: 0; transform: translateX(40px); }\
          to { opacity: 1; transform: translateX(0); }\
        }\
        @keyframes bounce {\
          0%, 100% { transform: translateY(0); }\
          50% { transform: translateY(8px); }\
        }\
      "}</style>
    </div>
  );
}
