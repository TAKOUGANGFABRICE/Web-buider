import React from 'react';
import {
  FiFileText, FiSend, FiMail, FiActivity
} from 'react-icons/fi';

export default function StatCard({ title, value, icon, trend, trendUp, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export const FORM_STATS = [
  { title: 'Total Forms', value: '12', icon: <FiFileText size={20} />, trend: '+2 this month', trendUp: true, color: 'primary' },
  { title: 'Total Submissions', value: '2,847', icon: <FiSend size={20} />, trend: '+18.2%', trendUp: true, color: 'success' },
  { title: 'Unread Messages', value: '8', icon: <FiMail size={20} />, trend: '3 new today', trendUp: false, color: 'warning' },
  { title: 'Conversion Rate', value: '3.8%', icon: <FiActivity size={20} />, trend: '+0.4%', trendUp: true, color: 'primary' },
];
