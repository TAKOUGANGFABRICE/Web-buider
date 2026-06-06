import React from 'react';
import { FiFileText, FiMail, FiInbox } from 'react-icons/fi';

export default function EmptyState({ type = 'forms' }) {
  const config = {
    forms: { title: 'No forms yet', subtitle: 'Create your first form to start collecting submissions from your website visitors.', icon: <FiFileText size={32} className="text-slate-400" /> },
    submissions: { title: 'No submissions yet', subtitle: 'Submissions will appear here when visitors fill out forms on your published websites.', icon: <FiInbox size={32} className="text-slate-400" /> },
    messages: { title: 'No messages yet', subtitle: 'Contact form messages will appear here once you start receiving inquiries.', icon: <FiMail size={32} className="text-slate-400" /> },
    builder: { title: 'No fields added', subtitle: 'Click a field type from the left panel to add it to your form.', icon: <FiFileText size={32} className="text-slate-400" /> },
  };
  const { title, subtitle, icon } = config[type] || config.forms;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-base font-medium text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}
