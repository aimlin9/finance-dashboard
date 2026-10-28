import { ExternalLink, Globe } from 'lucide-react';
import PublicShell from '../components/layout/PublicShell';
import { Button } from '../components/ui';

const STACK = ['Python', 'Django REST', 'React 19', 'Tailwind CSS 4', 'PostgreSQL', 'spaCy', 'Google Gemini', 'Recharts', 'pdfplumber', 'Motion'];

export default function About() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="eyebrow">About</p>
        <h1 className="display mt-3 text-[40px] leading-[1.05] text-ink sm:text-[56px]">Bank apps show transactions. They don’t explain them.</h1>
        <div className="mt-10 space-y-5 text-[17px] leading-relaxed text-ink-2">
          <p>
            Most people in Ghana have no clear picture of where their money goes. A statement is a list of dates, amounts
            and reference codes like <span className="font-mono text-[15px] text-ink">300304******0000 Ref 0736</span>. No categories, no totals, no sense of the month.
          </p>
          <p>
            FinTrack Ghana reads GCB, Ecobank and MTN MoMo statements, and CSV exports from any other bank, and turns them into
            something you can act on: where the money went, what repeats every month, what changed, and what to adjust.
          </p>
        </div>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
          {[
            ['3 native formats', 'GCB, Ecobank and MTN MoMo, in PDF and CSV, plus a generic importer for other banks’ CSVs.'],
            ['14 categories', 'Including Church & Giving, Fees & Charges (E-levy, SMS alerts) and Cash Withdrawal.'],
            ['Layered categorizing', 'Your own rules, then ~200 known merchants and keywords, then a spaCy model that only answers when it recognises the words.'],
            ['Optional AI advice', 'Google Gemini 2.5 Flash, sent category totals only, and only when you ask.'],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-6">
              <dt className="display text-[22px] text-ink">{k}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-3">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="eyebrow mt-16">Built with</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {STACK.map((t) => <li key={t} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-2">{t}</li>)}
        </ul>

        <section className="card mt-16 flex flex-col gap-6 p-7 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-soft font-mono text-lg text-gold">GR</span>
          <div className="flex-1">
            <p className="display text-xl text-ink">Gyimah Ramsey Opoku</p>
            <p className="text-sm text-ink-3">Computer Science student · Accra, Ghana</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">Building software that solves real problems for African markets.</p>
          </div>
          <div className="flex gap-2">
            <Button href="https://github.com/aimlin9" target="_blank" rel="noreferrer" variant="secondary" size="sm" icon={ExternalLink}>GitHub</Button>
            <Button href="https://dev.to/aimlin9" target="_blank" rel="noreferrer" variant="secondary" size="sm" icon={Globe}>Dev.to</Button>
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
