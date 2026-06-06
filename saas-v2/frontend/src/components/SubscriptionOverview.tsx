import React from 'react'
import { mockSubscription } from '../data/mockData'
import { Crown, Check, ArrowRight } from 'lucide-react'

export const SubscriptionOverview: React.FC = () => {
  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-2">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{mockSubscription.plan}</h3>
            <p className="text-sm text-brand-100">Renews {mockSubscription.renewalDate}</p>
          </div>
        </div>
        <a 
          href="/billing" 
          className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30 transition-colors"
        >
          Manage
        </a>
      </div>
      
      <div className="mt-4">
        <p className="text-3xl font-bold">
          {mockSubscription.price}<span className="text-lg font-normal text-brand-200">{mockSubscription.interval}</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {mockSubscription.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-200" />
            <span className="text-sm text-brand-100">{feature}</span>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full rounded-xl bg-white/20 py-2.5 text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
        Upgrade plan <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}