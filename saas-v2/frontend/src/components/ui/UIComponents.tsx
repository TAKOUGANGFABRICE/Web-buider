import React from 'react'
import { ArrowUpRight, ArrowDownRight, Globe, Users, FileText, Database, BarChart3, Activity, Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export const StatCard: React.FC<{
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
}> = ({ title, value, change, changeType = 'neutral', icon }) => {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {changeType === 'positive' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
              {changeType === 'negative' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-slate-600'
              }`}>
                {change}
              </span>
              <span className="text-sm text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-brand-50 p-3">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export const Badge: React.FC<{
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export const Button: React.FC<{
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  to?: string
}> = ({ children, variant = 'primary', size = 'md', onClick, to }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  if (to) {
    return (
      <a href={to} className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  )
}