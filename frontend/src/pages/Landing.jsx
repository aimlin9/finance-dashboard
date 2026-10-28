import { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, CalendarRange, FileDown, KeyRound, Lock, Repeat, ShieldCheck, Smartphone, Sparkles, Trash2, Wallet, Wand2,
} from 'lucide-react';
import PublicShell from '../components/layout/PublicShell';
import { Button, CategoryIcon } from '../components/ui';
import { money } from '../lib/format';
import { warmUp } from '../lib/api';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

// Sample month for the product vignette. Labelled as sample in the UI.
const SAMPLE = [
  ['food', 'Food & Groceries', 1184.5, 100],
  ['transport', 'Transport', 642.0, 54],
  ['utilities', 'Bills & Airtime', 418.75, 35],
  ['giving', 'Church & Giving', 300.0, 25],
  ['charges', 'Fees & Charges', 46.2, 4],
];

function Vignette() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <motion.div variants={fade} initial="hidden" animate="show" custom={2} className="card relative overflow-hidden p-6 shadow-lg">
        <div className="ledger-rule pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Left over in March</p>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">Sample</span>
          </div>
          <p className="display num mt-3 text-[46px] leading-none tracking-[-0.035em] text-ink">{money(1284.6)}</p>
          <p className="mt-2 text-sm text-ink-2">You kept 21% of what came in</p>
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" aria-hidden>
            <div className="h-full bg-expense" style={{ width: '79%' }} />
            <span className="w-[2px] bg-surface" />
            <div className="h-full flex-1 bg-income" />
          </div>
          <ul className="mt-6 space-y-3">
            {SAMPLE.map(([slug, name, amount, width], i) => (
              <li key={slug} className="flex items-center gap-3">
                <CategoryIcon slug={slug} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink">{name}</span>
                    <span className="num text-ink-2">{money(amount)}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-surface-3">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      style={{ opacity: i === 0 ? 1 : 0.6 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24, rotate: 2 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-16 -left-6 hidden w-64 rounded-2xl border border-line bg-surface p-3.5 shadow-md sm:block"
      >
        <p className="font-mono text-[11px] leading-snug text-ink-3">TELECEL AIRTIME 0244XXXXXX</p>
        <div className="mt-2 flex items-center gap-2">
          <ArrowRight size={13} className="text-ink-3" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            Bills &amp; Airtime
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -16, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.8, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-3 -top-6 hidden rounded-2xl border border-line bg-surface px-4 py-3 shadow-md sm:block"
      >
        <p className="text-[11px] text-ink-3">Fees &amp; E-levy this month</p>
        <p className="num text-sm font-semibold text-ink">{money(46.2)}</p>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  { icon: CalendarRange, title: 'A calendar of your spending', body: 'See which days the money went: payday weekends, school-fee week, the Friday trotro-and-waakye run.', span: 'md:col-span-2' },
  { icon: Wallet, title: 'Budgets that suggest themselves', body: 'Limits start from what you actually spend, with an alert at 80%.' },
  { icon: Repeat, title: 'Recurring bills, found for you', body: 'Rent, data bundles and transfers home, with the next due date and the cost per year.' },
  { icon: Wand2, title: 'It learns your corrections', body: 'Fix “TRANSFER TO KOFI MENSAH” once as rent, and every future upload files it the same way.', span: 'md:col-span-2' },
  { icon: Sparkles, title: 'An advisor note, when you want it', body: 'Three specific suggestions from Google Gemini, based on your category totals only.' },
  { icon: FileDown, title: 'Reports and CSV', body: 'A clean monthly summary to print or save as PDF, and every transaction as CSV for Excel or Google Sheets.', span: 'md:col-span-2' },
];

const FAQ = [
  ['Which banks work?', 'GCB, Ecobank and MTN MoMo statements as PDF or CSV. For any other bank (Absa, Fidelity, Stanbic, CalBank and others), download the CSV export: FinTrack finds the date, description and amount columns itself.'],
  ['My bank PDF asks for a password.', 'Banks often lock statements, usually with your date of birth or account number. Open it once, choose Print → Save as PDF, and upload that unlocked copy.'],
  ['Do you connect to my bank account?', 'No. There is no bank login and no access to move money. FinTrack only reads the statement files you choose to upload.'],
  ['What happens to the file?', 'It is read once, the transactions are saved to your account, and the file is deleted. You can delete any statement, or your whole account, from inside the app.'],
  ['Does it work on my phone?', 'Yes, it is designed for phones first. On Android choose “Add to Home screen” or “Install app”; on iPhone tap Share → “Add to Home Screen”. It opens full-screen like an app.'],
  ['Is it free?', 'Yes. FinTrack is an independent project built in Accra.'],
];

export default function Landing() {
  useEffect(() => {
    warmUp();
  }, []);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-32">
          <div>
            <motion.p variants={fade} initial="hidden" animate="show" className="eyebrow">
              Personal finance · made for Ghana
            </motion.p>
            <motion.h1 variants={fade} initial="hidden" animate="show" custom={1} className="display mt-5 text-[46px] font-normal leading-[0.98] tracking-[-0.035em] text-ink sm:text-[68px] lg:text-[80px]">
              Know where every <em className="pr-[0.08em] font-normal italic text-accent">cedi</em> goes.
            </motion.h1>
            <motion.p variants={fade} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Upload a GCB, Ecobank or MTN MoMo statement. FinTrack reads every line (trotro fares, ECG tokens,
              E-levy, the transfer to Mum) and shows you your month in plain numbers.
            </motion.p>
            <motion.div variants={fade} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" size="lg" iconRight={ArrowRight}>Read my first statement</Button>
              <Button href="#how" size="lg" variant="secondary">How it works</Button>
            </motion.div>
            <motion.p variants={fade} initial="hidden" animate="show" custom={4} className="mt-6 flex items-center gap-2 text-[13px] text-ink-3">
              <ShieldCheck size={15} className="text-accent" /> No bank login. Files are deleted after reading.
            </motion.p>
          </div>
          <Vignette />
        </div>
      </section>

      {/* Banks strip */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
          <p className="eyebrow">Reads statements from</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[15px] font-medium text-ink-2">
            <li>GCB Bank</li>
            <li>Ecobank</li>
            <li>MTN MoMo</li>
            <li className="text-ink-3">+ any bank’s CSV export</li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-3 max-w-2xl text-[36px] leading-[1.05] text-ink sm:text-[48px]">From PDF to a clear picture in about a minute.</h2>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line md:grid-cols-3">
            {[
              ['Download your statement', 'From your banking app, internet banking or the MoMo app. A month or a whole year.'],
              ['Drop it in', 'FinTrack recognises the bank, reads each transaction and skips any you have already imported.'],
              ['Read your month', 'Every line sorted into categories you can correct, with budgets, recurring bills and trends.'],
            ].map(([title, body], i) => (
              <li key={title} className="bg-surface p-7 sm:p-8">
                <span className="display text-[56px] leading-none text-gold">{i + 1}</span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">What you get</p>
              <h2 className="display mt-3 max-w-xl text-[36px] leading-[1.05] text-ink sm:text-[48px]">Built for how money actually moves here.</h2>
            </div>
            <p className="max-w-sm text-[15px] leading-relaxed text-ink-2">
              Fourteen categories that make sense in Ghana, including Church &amp; Giving, Fees &amp; Charges and Cash Withdrawal, not a template made for somewhere else.
            </p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, span }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-[22px] border border-line bg-bg p-7 ${span || ''}`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={20} strokeWidth={1.8} /></span>
                <h3 className="mt-6 text-[17px] font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 bg-[#121411] text-[#ecebe4]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8f9187]">Privacy</p>
            <h2 className="display mt-3 text-[36px] leading-[1.05] sm:text-[48px]">Your statement is your business.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#b9b8ae]">
              A bank statement says a lot about a life. FinTrack is built to need as little of it as possible, and to let go of it easily.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[22px] border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              [KeyRound, 'No bank login', 'Nothing connects to your account. You upload files; nothing can move money.'],
              [Trash2, 'Files deleted after reading', 'Only the transactions are kept, and only in your account.'],
              [Sparkles, 'AI sees totals, not transactions', 'If you ask for advice, only category totals are sent. No names or account numbers.'],
              [Lock, 'Leave whenever you like', 'Export everything as CSV, then delete your account in Settings.'],
            ].map(([Icon, title, body]) => (
              <li key={title} className="bg-[#121411] p-6">
                <Icon size={19} className="text-[#d9ae55]" />
                <p className="mt-4 font-medium">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#8f9187]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <p className="eyebrow">Questions</p>
        <h2 className="display mt-3 text-[36px] leading-[1.05] text-ink sm:text-[44px]">Good to know</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 rounded-[28px] bg-accent p-8 text-accent-ink sm:p-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="display text-[34px] leading-[1.05] sm:text-[46px]">Read last month properly.</h2>
            <p className="mt-3 flex items-center gap-2 text-[15px] opacity-80"><Smartphone size={16} /> Works on any phone. Install it to your home screen.</p>
          </div>
          <Button to="/register" size="lg" variant="ink" iconRight={ArrowRight} className="shrink-0">Create a free account</Button>
        </div>
      </section>
    </PublicShell>
  );
}
