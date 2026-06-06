import React from 'react'
import { mockActivities } from '../data/mockData'
import { CheckCircle, AlertCircle, Clock, Link as LinkIcon, LayoutTemplate } from 'lucide-react'

export const RecentActivityFeed: React.FC = () => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'check': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'edit': return <Clock className="h-4 w-4 text-blue-500" />
      case 'plus': return <LinkIcon className="h-4 w-4 text-purple-500" />
      case 'link': return <LinkIcon className="h-4 w-4 text-brand-500" />
      case 'template': return <LayoutTemplate className="h-4 w-4 text-amber-500" />
      default: return <AlertCircle className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          <p className="mt-1 text-sm text-slate-600">Your latest actions</p>
        </div>
        <button className="text-sm font-medium text-brand-600 hover:text-brand-700">
          View all
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="rounded-full bg-slate-50 p-2">
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium text-slate-900">{activity.action}</span>
                {' '}
                <span className="text-brand-600">{activity.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}