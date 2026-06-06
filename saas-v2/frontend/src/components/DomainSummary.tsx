import React from 'react'
import { Globe, Check, AlertCircle } from 'lucide-react'
import { mockDomains } from '../data/mockData'

export const DomainSummary: React.FC = () => {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Domain Summary</h3>
          <p className="mt-1 text-sm text-slate-600">Your connected domains</p>
        </div>
        <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
          <Globe className="h-5 w-5" />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-2xl font-bold text-slate-900">{mockDomains.total}</p>
          <p className="text-xs text-slate-600 mt-1">Total domains</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-2xl font-bold text-green-600">{mockDomains.connected}</p>
          <p className="text-xs text-slate-600 mt-1">Connected</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-2xl font-bold text-amber-600">{mockDomains.pending}</p>
          <p className="text-xs text-slate-600 mt-1">Pending</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-slate-900">mysite.com</span>
          <span className="ml-auto text-xs text-slate-600">Active</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-slate-900">portfolio.net</span>
          <span className="ml-auto text-xs text-slate-600">Active</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-slate-900">newdomain.org</span>
          <span className="ml-auto text-xs text-amber-600">Verifying</span>
        </div>
      </div>

      <button className="mt-4 w-full rounded-xl border border-brand-200 bg-brand-50 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors">
        Add Domain
      </button>
    </div>
  )
}