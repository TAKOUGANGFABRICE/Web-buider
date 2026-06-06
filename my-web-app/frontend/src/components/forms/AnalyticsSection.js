import React from 'react';
import { FiTrendingUp, FiDownload } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function AnalyticsSection({ analytics }) {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Submissions" value={analytics.totalSubmissions.toLocaleString()} icon={<FiTrendingUp />} />
        <KpiCard label="Avg Daily Submissions" value={analytics.avgDaily} />
        <KpiCard label="Conversion Rate" value={analytics.conversionRate} icon={<FiTrendingUp />} />
        <KpiCard label="Top Form" value={analytics.popularForm} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Submission Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submissions" stroke="#6366F1" strokeWidth={2} name="Submissions" />
              <Line type="monotone" dataKey="conversions" stroke="#22C55E" strokeWidth={2} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversion Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="conversions" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      {icon && <div className="mt-2 text-slate-400">{icon}</div>}
    </div>
  );
}
