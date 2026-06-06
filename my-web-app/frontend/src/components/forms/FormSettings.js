import React from 'react';
import { FiSettings as FiCog } from 'react-icons/fi';

export default function FormSettings({ form, setFormSettings, onSave }) {
  if (!form) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FiCog className="text-slate-400" />
        <h3 className="text-base font-semibold text-slate-900">{form.name} Settings</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Form Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setFormSettings({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setFormSettings({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
          rows={2}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Submission Settings</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Success Message</label>
            <input
              type="text"
              value={form.settings?.successMessage || ''}
              onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, successMessage: e.target.value } })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Redirect URL (optional)</label>
            <input
              type="url"
              value={form.settings?.redirectUrl || ''}
              onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, redirectUrl: e.target.value } })}
              placeholder="https://yoursite.com/thank-you"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Notifications</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.settings?.adminNotify || false} onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, adminNotify: e.target.checked } })} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm text-slate-700">Admin Email Notification</span>
              <p className="text-xs text-slate-500">Receive an email when a form is submitted</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.settings?.userNotify || false} onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, userNotify: e.target.checked } })} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm text-slate-700">User Confirmation Email</span>
              <p className="text-xs text-slate-500">Send a confirmation to the submitter</p>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Security</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.settings?.captcha || false} onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, captcha: e.target.checked } })} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm text-slate-700">Enable CAPTCHA</span>
              <p className="text-xs text-slate-500">Add reCAPTCHA verification to prevent bots</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.settings?.spamProtection || false} onChange={(e) => setFormSettings({ ...form, settings: { ...form.settings, spamProtection: e.target.checked } })} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm text-slate-700">Spam Protection</span>
              <p className="text-xs text-slate-500">Filter spam submissions using built-in rules</p>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={() => onSave(form)}
        className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Save Settings
      </button>
    </div>
  );
}
