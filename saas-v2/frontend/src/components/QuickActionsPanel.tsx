import React from 'react'
import { Plus, LayoutTemplate, Link as LinkIcon, Edit } from 'lucide-react'
import { Button } from './ui/UIComponents'

export const QuickActionsPanel: React.FC = () => {
  const actions = [
    { icon: <Plus className="h-5 w-5" />, label: 'Create Website', to: '/editor/new', description: 'Start a new website project' },
    { icon: <LayoutTemplate className="h-5 w-5" />, label: 'Choose Template', to: '/templates', description: 'Browse template gallery' },
    { icon: <LinkIcon className="h-5 w-5" />, label: 'Connect Domain', to: '/settings', description: 'Link your custom domain' },
    { icon: <Edit className="h-5 w-5" />, label: 'Open Builder', to: '/editor/new', description: 'Launch visual editor' }
  ]

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
      <p className="mt-1 text-sm text-slate-600">Common tasks and shortcuts</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.to}
            className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-brand-200 hover:bg-brand-50 transition-colors"
          >
            <div className="rounded-lg bg-brand-100 p-2 text-brand-600">
              {action.icon}
            </div>
            <div>
              <p className="font-medium text-slate-900">{action.label}</p>
              <p className="text-sm text-slate-600">{action.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}