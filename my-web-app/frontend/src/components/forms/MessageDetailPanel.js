import React, { useState } from 'react';
import { FiMail, FiPhone, FiUser, FiSend, FiArchive, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function MessageDetailPanel({ message, onClose, onReply, onArchive, onDelete }) {
  const [replySubject, setReplySubject] = useState(`Re: ${message?.subject || ''}`);
  const [replyBody, setReplyBody] = useState('');
  const [attachments, setAttachments] = useState([]);

  if (!message) return null;

  const handleSendReply = () => {
    if (!replyBody.trim()) return;
    onReply(message.id, { subject: replySubject, body: replyBody, attachments });
    setReplyBody('');
    setReplySubject(`Re: ${message.subject}`);
    setAttachments([]);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size }))]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <FiArrowLeft size={18} />
          </button>
          <h3 className="text-base font-semibold text-slate-900">Message Details</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onReply(message.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100">
            <FiSend size={13} /> Reply
          </button>
          <button onClick={() => onArchive(message.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100">
            <FiArchive size={13} /> {message.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button onClick={() => onDelete(message.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100">
            <FiTrash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid gap-4">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Visitor Information</span>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700"><FiUser className="text-slate-400" size={14} /> {message.name}</div>
              <div className="flex items-center gap-2 text-sm text-slate-700"><FiMail className="text-slate-400" size={14} /> {message.email}</div>
              {message.phone && <div className="flex items-center gap-2 text-sm text-slate-700"><FiPhone className="text-slate-400" size={14} /> {message.phone}</div>}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Message Details</span>
            <h4 className="mt-2 text-sm font-semibold text-slate-900">{message.subject}</h4>
            <div className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{message.message}</div>
            <p className="text-xs text-slate-400 mt-3">{new Date(message.date).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-5 bg-slate-50/50">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Compose Reply</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={replySubject}
            onChange={(e) => setReplySubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          />
          <ReactQuill theme="snow" value={replyBody} onChange={setReplyBody} className="bg-white rounded-lg" style={{ maxHeight: '200px' }} />
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
              📎 Attach Files
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((f, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{f.name}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setReplyBody(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Discard
            </button>
            <button
              onClick={handleSendReply}
              disabled={!replyBody.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend size={14} /> Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
