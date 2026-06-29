'use client';

import type { StatusName } from '@pkmn/dex';
import { Badge } from '@pokehub/frontend/shared-ui-components';

const statusConfig: Record<StatusName, { label: string; className: string }> = {
  par: { label: 'PAR', className: 'bg-yellow-500 text-black' },
  brn: { label: 'BRN', className: 'bg-orange-500 text-white' },
  slp: { label: 'SLP', className: 'bg-gray-400 text-white' },
  psn: { label: 'PSN', className: 'bg-purple-500 text-white' },
  tox: { label: 'TOX', className: 'bg-purple-700 text-white' },
  frz: { label: 'FRZ', className: 'bg-blue-300 text-black' },
};

interface StatusBadgeProps {
  status?: StatusName | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  const config = statusConfig[status];
  if (!config) return null;

  return <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>;
}
