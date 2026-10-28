import PublicShell from '../components/layout/PublicShell';

const DOCS = {
  privacy: {
    title: 'Privacy policy',
    updated: 'October 2026',
    sections: [
      ['Information we collect', 'Your email address, name, display currency and timezone when you create an account. When you upload a statement, the transactions in it (date, description, amount, balance) are saved to your account. The uploaded file itself is deleted as soon as it has been read.'],
      ['How we use it', 'To sort your transactions into categories, compute monthly summaries, budgets, recurring payments and comparisons, and to show them to you. Your data is only accessible through your signed-in account.'],
      ['AI advice', 'Only when you press “Generate” on the advisor note, the month’s totals and per-category totals (and the previous month’s, for comparison) are sent to Google Gemini. Individual transactions, descriptions, your name, email and account numbers are never sent.'],
      ['Local storage', 'Your browser stores your sign-in tokens and preferences such as theme. There are no third-party trackers, advertising cookies or analytics.'],
      ['Sharing', 'We do not sell, rent or share your personal data.'],
      ['Security', 'Passwords are hashed, sessions use expiring tokens, sign-in attempts are rate-limited, and every data endpoint requires authentication. Password reset links are sent by email only.'],
      ['Deleting your data', 'Delete any statement and its transactions from the Statements page. Delete your entire account, with every statement, transaction, budget, rule and goal, from Settings. Deletion is immediate and permanent.'],
      ['Contact', 'Questions about privacy: reach out via github.com/aimlin9.'],
    ],
  },
  terms: {
    title: 'Terms of service',
    updated: 'October 2026',
    sections: [
      ['Acceptance', 'By using FinTrack Ghana you agree to these terms. If you do not agree, please do not use the service.'],
      ['The service', 'FinTrack Ghana reads bank statements you upload, categorizes transactions, and shows spending analysis and optional AI-generated suggestions. It is provided as-is for personal use.'],
      ['Your account', 'Keep your password confidential and provide accurate information. You are responsible for activity under your account.'],
      ['Acceptable use', 'Use FinTrack only for lawful purposes and only with statements you are entitled to. Do not upload malicious files or attempt to access other people’s data.'],
      ['Not financial advice', 'FinTrack is a tracking tool, not a licensed financial adviser. AI suggestions are informational only. Consult a qualified professional for important financial decisions.'],
      ['Accuracy', 'Statement parsing and categorization are automatic and can be wrong. Check important figures against your original statement, and correct categories where needed.'],
      ['Availability', 'We aim to keep FinTrack available but cannot guarantee uninterrupted access.'],
      ['Liability', 'FinTrack is provided without warranties. We are not liable for indirect or consequential losses from using it.'],
      ['Changes', 'These terms may change. Continued use after a change means you accept the updated terms.'],
    ],
  },
};

export default function Legal({ doc }) {
  const { title, updated, sections } = DOCS[doc];
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="eyebrow">Last updated {updated}</p>
        <h1 className="display mt-3 text-[40px] leading-tight text-ink sm:text-[52px]">{title}</h1>
        <div className="mt-12 space-y-10">
          {sections.map(([heading, body], i) => (
            <section key={heading} className="grid grid-cols-1 gap-2 sm:grid-cols-[48px_1fr]">
              <span className="font-mono text-xs text-gold sm:pt-1.5">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="text-lg font-semibold text-ink">{heading}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
              </div>
            </section>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
