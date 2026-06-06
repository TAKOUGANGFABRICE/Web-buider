import React from 'react'
import { mockNotifications } from '../data/mockData'
import { Badge } from './ui/UIComponents'

export const NotificationsWidget: React.FC = () => {
  const getVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          <p className="mt-1 text-sm text-slate-600">Recent updates and alerts</p>
        </div>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {mockNotifications.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {mockNotifications.map((notification) => (
          <div key={notification.id} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'warning' ? 'bg-amber-500' : 'bg-brand-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-slate-900">{notification.message}</p>
                <p className="mt-1 text-xs text-slate-600">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full text-sm font-medium text-brand-600 hover:text-brand-700">
        Mark all as read
      </button>
    </div>
  )
}