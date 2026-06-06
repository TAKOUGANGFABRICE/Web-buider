function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function inputClass(meta: { dirty?: boolean; error?: string }) {
  return cx(
    'w-full rounded-xl border px-3 py-2 text-sm outline-none transition',
    meta.dirty && meta.error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-brand-500'
  );
}

export function labelClass() {
  return 'mb-1 block text-sm font-medium text-slate-700';
}

export function fieldErrorClass(meta?: { error?: string }) {
  return cx('mt-1 text-xs', meta?.error ? 'text-red-600' : 'invisible');
}

export function fieldErrorText(meta?: { error?: string }) {
  return meta?.error || 'placeholder';
}
