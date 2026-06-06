import React from 'react';
import { FiEye, FiEyeOff, FiMail, FiTrash2 } from 'react-icons/fi';

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  read: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  replied: 'bg-green-50 text-green-700 ring-green-600/20',
};

export default function SubmissionsTable({ submissions, onSelect, selectedId, onStatusChange, onDelete }) {
  if (!submissions.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FiMail className="text-slate-400" size={24} />
        </div>
        <p className="text-slate-500 text-sm">No submissions match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Form</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => (
            <tr
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${selectedId === sub.id ? 'bg-primary-50' : ''}`}
            >
              <td className="py-3.5 font-medium text-slate-900">{sub.name}</td>
              <td className="py-3.5 text-slate-600">{sub.email}</td>
              <td className="py-3.5 text-slate-600">{sub.form_name}</td>
              <td className="py-3.5 text-slate-500">{new Date(sub.date).toLocaleDateString()}</td>
              <td className="py-3.5">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[sub.status] || STATUS_STYLES.new}`}>
                  {sub.status}
                </span>
              </td>
              <td className="py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {sub.status === 'new' && (
                    <ActionBtn icon={<FiEye size={14} />} label="Mark Read" onClick={(e) => { e.stopPropagation(); onStatusChange(sub.id, 'read'); }} />
                  )}
                  {sub.status !== 'new' && (
                    <ActionBtn icon={<FiMail size={14} />} label="Reply" onClick={(e) => { e.stopPropagation(); onStatusChange(sub.id, 'replied'); }} />
                  )}
                  <ActionBtn icon={<FiTrash2 size={14} />} label="Delete" onClick={(e) => { e.stopPropagation(); onDelete(sub.id); }} variant="danger" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, variant = 'default' }) {
  const base = 'inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors';
  const variants = {
    default: 'text-slate-600 hover:text-primary-600 hover:bg-primary-50',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
  };
  return <button onClick={onClick} className={`${base} ${variants[variant]}`}>{icon} <span className="hidden lg:inline">{label}</span></button>;
}
