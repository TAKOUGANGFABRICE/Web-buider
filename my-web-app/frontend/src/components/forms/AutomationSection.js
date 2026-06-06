import React, { useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

export default function AutomationSection() {
  const [automations, setAutomations] = useState([
    { id: 1, name: 'Auto-reply Emails', description: 'Send an automatic reply to form submissions', enabled: true },
    { id: 2, name: 'Notify Team Members', description: 'Email your team when new submissions arrive', enabled: true },
    { id: 3, name: 'Save Leads to CRM', description: 'Automatically sync new leads to your CRM', enabled: false },
    { id: 4, name: 'Webhook Integration', description: 'POST submission data to a webhook URL', enabled: false },
  ]);

  const toggle = (id) => setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4">
      <h3 className="text-base font-semibold text-slate-900">Automation Settings</h3>
      <p className="text-sm text-slate-500">Configure automated actions when forms are submitted.</p>
      <div className="space-y-3 mt-4">
        {automations.map((auto) => (
          <div key={auto.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-900">{auto.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{auto.description}</p>
            </div>
            <button
              onClick={() => toggle(auto.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${auto.enabled ? 'bg-primary-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${auto.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
