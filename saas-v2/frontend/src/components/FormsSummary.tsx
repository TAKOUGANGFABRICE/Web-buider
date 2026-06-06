import React from 'react'
import { FileText, TrendingUp, BarChart2 } from 'lucide-react'
import { mockForms } from '../data/mockData'

export const FormsSummary: React.FC = () => {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Forms Summary</h3>
          <p className="mt-1 text-sm text-slate-600">Form submissions overview</p>
        </div>
        <div className="rounded-lg bg-green-50 p-2 text-green-600">
          <FileText className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Total Forms</p>
            <p className="text-2xl font-bold text-slate-900">{mockForms.total}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Total Submissions</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-slate-900">{mockForms.submissions}</p>
              <span className="flex items-center gap-0.5 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                8.2%
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Avg. Conversion</p>
            <p className="text-2xl font-bold text-brand-600">{mockForms.conversion}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Top performing forms</span>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Contact Form</span>
              <span className="font-medium text-slate-900">48 submissions</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Newsletter Signup</span>
              <span className="font-medium text-slate-900">32 submissions</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Support Request</span>
              <span className="font-medium text-slate-900">21 submissions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}