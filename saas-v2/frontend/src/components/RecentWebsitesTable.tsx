import React from 'react'
import { mockWebsites } from '../data/mockData'
import { Badge } from './ui/UIComponents'

export const RecentWebsitesTable: React.FC = () => {
  const getStatusVariant = (status: string) => {
    return status === 'published' ? 'success' : 'warning'
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900">Recent Websites</h3>
        <p className="mt-1 text-sm text-slate-600">Manage your website projects</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-100">
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Visitors</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Last Updated</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockWebsites.map((website) => (
              <tr key={website.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand-700">
                        {website.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{website.name}</p>
                      <p className="text-sm text-slate-600">ID: {website.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusVariant(website.status)}>
                    {website.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {website.visitors.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(website.lastUpdated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
                      Edit
                    </button>
                    <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100">
        <button className="text-sm font-medium text-brand-600 hover:text-brand-700">
          View all websites →
        </button>
      </div>
    </div>
  )
}