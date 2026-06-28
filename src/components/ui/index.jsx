import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/* ── Button ── */
export function Button({ children, variant = 'primary', size = 'md', icon, loading, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-primary text-white hover:brightness-110 shadow-primary-glow/50',
    secondary: 'bg-surface-high border border-outline-var text-on-surface hover:bg-surface-highest',
    ghost:     'text-on-surface-var hover:bg-surface-high hover:text-on-surface',
    danger:    'bg-error/10 text-error border border-error/30 hover:bg-error/20',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-label-md',
    md: 'px-4 py-2 text-body-md',
    lg: 'px-6 py-3 text-body-lg',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading}
      {...props}
    >
      {loading
        ? <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>
        : icon && <span className="material-symbols-outlined !text-[18px]">{icon}</span>
      }
      {children}
    </motion.button>
  );
}

/* ── Badge / Chip ── */
export function Badge({ label, variant = 'secondary', dot = false }) {
  const variants = {
    success:  'chip chip-success',
    warning:  'chip chip-warning',
    error:    'chip chip-error',
    secondary:'chip chip-secondary',
    primary:  'chip bg-primary/15 text-primary',
  };
  return (
    <span className={variants[variant]}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-success': variant === 'success',
        'bg-warning': variant === 'warning',
        'bg-error':   variant === 'error',
        'bg-primary': variant === 'primary',
        'bg-on-surface-var': variant === 'secondary',
      })} />}
      {label}
    </span>
  );
}

/* ── Card ── */
export function Card({ children, className, hover = false, padding = true }) {
  return (
    <div className={clsx(
      'bg-surface border border-outline-var rounded-xl',
      padding && 'p-stack-md',
      hover && 'hover:border-primary/30 hover:shadow-primary-glow transition-all duration-200',
      className
    )}>
      {children}
    </div>
  );
}

/* ── Metric Card ── */
export function MetricCard({ icon, label, value, trend, trendLabel, highlight }) {
  const isUp = trend > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'metric-card',
        highlight && 'border-error/40 bg-error/5'
      )}
    >
      <div className="flex items-center justify-between mb-stack-sm">
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          highlight ? 'bg-error/10' : 'bg-primary/10'
        )}>
          <span className={clsx('material-symbols-outlined !text-[20px]', highlight ? 'text-error' : 'text-primary')}>
            {icon}
          </span>
        </div>
        {trend !== undefined && (
          <span className={clsx(
            'flex items-center gap-0.5 text-label-sm font-semibold',
            isUp ? 'text-success' : 'text-error'
          )}>
            <span className="material-symbols-outlined !text-[14px]">
              {isUp ? 'trending_up' : 'trending_down'}
            </span>
            {Math.abs(trend)}%
          </span>
        )}
        {highlight && <Badge label="Critical" variant="error" />}
      </div>
      <p className="text-label-md uppercase tracking-widest text-on-surface-var mb-1">{label}</p>
      <p className="text-headline-md font-bold text-on-surface">{value}</p>
      {trendLabel && <p className="text-label-sm text-on-surface-var mt-1">{trendLabel}</p>}
    </motion.div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
        className={clsx('relative bg-surface border border-outline-var rounded-xl shadow-modal w-full', sizes[size])}
      >
        <div className="flex items-center justify-between px-stack-lg py-stack-md border-b border-outline-var">
          <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-high text-on-surface-var transition-colors">
            <span className="material-symbols-outlined !text-[20px]">close</span>
          </button>
        </div>
        <div className="p-stack-lg">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/* ── Input Field (MD3 Filled) ── */
export function InputField({ label, icon, error, className, ...props }) {
  return (
    <div className={clsx('relative', className)}>
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px] pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={clsx(
          'w-full bg-surface-high border border-outline-var rounded-lg',
          'px-stack-md py-2.5 text-body-md text-on-surface',
          'placeholder-on-surface-var/50',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all',
          icon && 'pl-10',
          error && 'border-error focus:border-error focus:ring-error/30'
        )}
        {...props}
      />
      {label && <label className="block text-label-sm text-on-surface-var mb-1">{label}</label>}
      {error  && <p className="text-label-sm text-error mt-1">{error}</p>}
    </div>
  );
}

/* ── Select ── */
export function SelectField({ label, options = [], error, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-label-sm text-on-surface-var mb-1">{label}</label>}
      <select
        className={clsx(
          'w-full bg-surface-high border border-outline-var rounded-lg',
          'px-stack-md py-2.5 text-body-md text-on-surface',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all',
          error && 'border-error'
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-label-sm text-error mt-1">{error}</p>}
    </div>
  );
}

/* ── Table wrapper ── */
export function DataTable({ columns, data, loading, emptyMessage = 'No data found', onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    <div className="h-4 bg-surface-high rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-on-surface-var">
                <span className="material-symbols-outlined !text-[40px] block mx-auto mb-2 opacity-40">inbox</span>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <motion.tr
                key={row._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-stack-md border-t border-outline-var mt-auto">
      <p className="text-label-sm text-on-surface-var">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" icon="chevron_left"  onClick={() => onChange(page - 1)} disabled={page <= 1} />
        <Button variant="ghost" size="sm" icon="chevron_right" onClick={() => onChange(page + 1)} disabled={page >= totalPages} />
      </div>
    </div>
  );
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-stack-lg">
      <div>
        <h2 className="text-headline-md font-bold text-on-surface">{title}</h2>
        {subtitle && <p className="text-body-md text-on-surface-var mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
