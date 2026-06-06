import React from 'react'
import { Database, Image, File, Film, Trash2, Upload } from 'lucide-react'
import { mockStorage } from '../data/mockData'

export const MediaStorageSummary: React.FC = () => {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Media Storage</h3>
          <p className="mt-1 text-sm text-slate-600">Storage usage overview</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
          <Database className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Used Storage</p>
          <p className="text-sm font-medium text-slate-900">
            {mockStorage.used} / {mockStorage.total}
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div 
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${mockStorage.percentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-600">{mockStorage.percentage}% of {mockStorage.total} used</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-100 p-2 text-center">
          <Image className="mx-auto h-5 w-5 text-blue-500" />
          <p className="mt-1 text-xs text-slate-600">Images</p>
          <p className="text-sm font-semibold text-slate-900">248</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-2 text-center">
          <Film className="mx-auto h-5 w-5 text-purple-500" />
          <p className="mt-1 text-xs text-slate-600">Videos</p>
          <p className="text-sm font-semibold text-slate-900">12</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-2 text-center">
          <File className="mx-auto h-5 w-5 text-amber-500" />
          <p className="mt-1 text-xs text-slate-600">Files</p>
          <p className="text-sm font-semibold text-slate-900">34</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-xl border border-brand-200 bg-brand-50 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors flex items-center justify-center gap-1">
          <Upload className="h-4 w-4" />
          Upload
        </button>
        <button className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
          <Trash2 className="h-4 w-4" />
          Cleanup
        </button>
      </div>
    </div>
  )
}