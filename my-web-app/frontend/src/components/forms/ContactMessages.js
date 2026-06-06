import React from 'react';
import { FiMail, FiArchive, FiTrash2, FiReply } from 'react-icons/fi';

export default function ContactMessages({ messages, onSelect, selectedId, onArchive, onDelete }) {
  if (!messages.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FiMail className="text-slate-400" size={24} />
        </div>
        <p className="text-slate-500 text-sm">No contact messages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          onClick={() => onSelect(msg.id)}
          className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-soft transition-all ${selectedId === msg.id ? 'border-primary-300 bg-primary-50/50' : 'border-slate-200'} ${msg.archived ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 truncate">{msg.name}</span>
                {!msg.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />}
                {msg.archived && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Archived</span>}
              </div>
              <p className="text-sm text-slate-600 font-medium truncate">{msg.subject}</p>
              <p className="text-sm text-slate-500 truncate mt-0.5">{msg.message}</p>
              <p className="text-xs text-slate-400 mt-1.5">{msg.email} · {new Date(msg.date).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <ActionBtn icon={<FiReply size={14} />} label="Reply" onClick={(e) => { e.stopPropagation(); onSelect(msg.id); }} />
              <ActionBtn icon={<FiArchive size={14} />} label="Archive" onClick={(e) => { e.stopPropagation(); onArchive(msg.id); }} />
              <ActionBtn icon={<FiTrash2 size={14} />} label="Delete" onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} variant="danger" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, variant = 'default' }) {
  const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors';
  const variants = {
    default: 'text-slate-600 hover:text-primary-600 hover:bg-primary-50',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
  };
  return <button onClick={onClick} className={`${base} ${variants[variant]}`}>{icon} <span className="hidden md:inline">{label}</span></button>;
}
