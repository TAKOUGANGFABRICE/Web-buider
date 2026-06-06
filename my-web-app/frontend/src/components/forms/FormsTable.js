import React from 'react';
import { FiEdit2, FiEye, FiCopy, FiTrash2, FiList, FiFileText } from 'react-icons/fi';

export default function FormsTable({ forms, onEdit, onDuplicate, onDelete, onViewSubmissions }) {
  if (!forms.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FiFileText className="text-slate-400" size={24} />
        </div>
        <p className="text-slate-500 text-sm">No forms yet. Create your first form to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="pb-3 font-medium">Form Name</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium text-right">Submissions</th>
            <th className="pb-3 font-medium">Last Submission</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3.5 font-medium text-slate-900">{form.name}</td>
              <td className="py-3.5 text-slate-600 capitalize">{form.type}</td>
              <td className="py-3.5">
                <StatusBadge status={form.status} />
              </td>
              <td className="py-3.5 text-right text-slate-600">{form.submissions?.toLocaleString() || 0}</td>
              <td className="py-3.5 text-slate-500">{form.lastSubmission || 'Never'}</td>
              <td className="py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <ActionButton icon={<FiEdit2 size={14} />} label="Edit" onClick={() => onEdit(form)} />
                  <ActionButton icon={<FiEye size={14} />} label="Preview" onClick={() => onEdit(form)} />
                  <ActionButton icon={<FiCopy size={14} />} label="Duplicate" onClick={() => onDuplicate(form)} />
                  <ActionButton icon={<FiTrash2 size={14} />} label="Delete" onClick={() => onDelete(form.id)} variant="danger" />
                  <ActionButton icon={<FiList size={14} />} label="Submissions" onClick={() => onViewSubmissions(form)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = 'default' }) {
  const base = 'inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors';
  const variants = {
    default: 'text-slate-600 hover:text-primary-600 hover:bg-primary-50',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`} title={label}>
      {icon} <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-green-50 text-green-700 ring-green-600/20',
    draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}
