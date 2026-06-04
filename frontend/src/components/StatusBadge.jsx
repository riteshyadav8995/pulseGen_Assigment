import { CheckCircle, AlertTriangle, Clock, Loader2, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  safe: {
    label: 'Safe',
    className: 'badge-safe',
    Icon: CheckCircle,
  },
  flagged: {
    label: 'Flagged',
    className: 'badge-flagged',
    Icon: AlertTriangle,
  },
  processing: {
    label: 'Processing',
    className: 'badge-processing',
    Icon: Loader2,
    spin: true,
  },
  pending: {
    label: 'Pending',
    className: 'badge-pending',
    Icon: Clock,
  },
  error: {
    label: 'Error',
    className: 'badge-error',
    Icon: XCircle,
  },
};

const StatusBadge = ({ status, showIcon = true }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const { label, className, Icon, spin } = config;

  return (
    <span className={className}>
      {showIcon && (
        <Icon size={12} className={spin ? 'animate-spin' : ''} />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
