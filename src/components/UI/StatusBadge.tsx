import { LeadStatus } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
    'Contacted': 'bg-orange-100 text-orange-700 border-orange-200',
    'Closed': 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
      styles[status] || styles['New']
    )}>
      {status.toUpperCase()}
    </span>
  );
}
