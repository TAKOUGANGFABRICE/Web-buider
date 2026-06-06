// Mock data for SaaS Dashboard

export const mockWebsites = [
  { id: 1, name: 'Personal Portfolio', status: 'published', visitors: 2456, lastUpdated: '2026-06-04T10:30:00Z' },
  { id: 2, name: 'E-commerce Store', status: 'draft', visitors: 0, lastUpdated: '2026-06-03T15:45:00Z' },
  { id: 3, name: 'Company Landing Page', status: 'published', visitors: 1823, lastUpdated: '2026-06-02T09:15:00Z' },
  { id: 4, name: 'Blog Site', status: 'published', visitors: 987, lastUpdated: '2026-06-01T14:20:00Z' },
  { id: 5, name: 'Event Page', status: 'draft', visitors: 0, lastUpdated: '2026-05-30T11:00:00Z' }
]

export const mockTrafficData = [
  { day: 'Mon', visits: 120 },
  { day: 'Tue', visits: 190 },
  { day: 'Wed', visits: 150 },
  { day: 'Thu', visits: 210 },
  { day: 'Fri', visits: 280 },
  { day: 'Sat', visits: 180 },
  { day: 'Sun', visits: 140 }
]

export const mockActivities = [
  { id: 1, action: 'Published', target: 'Personal Portfolio', time: '2 hours ago', icon: 'check' },
  { id: 2, action: 'Updated', target: 'E-commerce Store', time: '4 hours ago', icon: 'edit' },
  { id: 3, action: 'Created', target: 'Blog Site', time: '1 day ago', icon: 'plus' },
  { id: 4, action: 'Domain connected', target: 'company.com', time: '2 days ago', icon: 'link' },
  { id: 5, action: 'Template applied', target: 'Event Page', time: '3 days ago', icon: 'template' }
]

export const mockSubscription = {
  plan: 'Pro Plan',
  price: '$29',
  interval: 'per month',
  features: ['10 websites', 'Unlimited visitors', 'Custom domains', 'Priority support'],
  renewalDate: '2026-07-15'
}

export const mockNotifications = [
  { id: 1, type: 'info', message: 'Welcome to SiteForge! Get started with a template.', time: 'Just now' },
  { id: 2, type: 'success', message: 'Your trial ends in 5 days.', time: '1 hour ago' },
  { id: 3, type: 'warning', message: 'Storage at 80% capacity.', time: '2 hours ago' }
]

export const mockDomains = {
  total: 3,
  connected: 2,
  pending: 1
}

export const mockForms = {
  total: 12,
  submissions: 142,
  conversion: '12.4%'
}

export const mockStorage = {
  used: '2.4 GB',
  total: '5 GB',
  percentage: 48
}