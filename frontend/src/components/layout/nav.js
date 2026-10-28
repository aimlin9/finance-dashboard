import {
  LayoutGrid, ArrowLeftRight, UploadCloud, Wallet, Target, GitCompareArrows, Repeat,
  FileText, FolderOpen, Wand2, Settings,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Money',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/budget', label: 'Budgets', icon: Wallet },
      { to: '/savings', label: 'Goals', icon: Target },
    ],
  },
  {
    label: 'Insight',
    items: [
      { to: '/recurring', label: 'Recurring', icon: Repeat },
      { to: '/compare', label: 'Compare months', icon: GitCompareArrows },
      { to: '/report', label: 'Monthly report', icon: FileText },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/upload', label: 'Upload statement', icon: UploadCloud },
      { to: '/statements', label: 'Statements', icon: FolderOpen },
      { to: '/rules', label: 'Category rules', icon: Wand2 },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const ALL_NAV = NAV_SECTIONS.flatMap((s) => s.items);

export function titleFor(pathname) {
  return ALL_NAV.find((i) => pathname.startsWith(i.to))?.label || 'FinTrack';
}
