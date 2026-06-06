export interface Page {
  id: string
  name: string
  slug: string
  title?: string
  is_homepage: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Website {
  id: string
  name: string
  slug: string
  subdomain?: string
  custom_domain?: string
  is_published: boolean
  seo_title?: string
  seo_description?: string
  pages: Page[]
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  category: string
  preview_image_url?: string
  is_premium: boolean
}

export interface MediaAsset {
  id: string
  filename: string
  file_path: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  website_id: string
  session_id: string
  event_type: string
  page_url?: string
  referrer?: string
  device_type?: string
  country?: string
  created_at: string
}

export interface Subscription {
  id: string
  plan: string
  status: string
  stripe_customer_id?: string
  current_period_start?: string
  current_period_end?: string
}

