import { Layout } from '../../components/Layout';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/ui/UIComponents';
import { QuickActionsPanel } from '../../components/QuickActionsPanel';
import { RecentWebsitesTable } from '../../components/RecentWebsitesTable';
import { TrafficAnalyticsChart } from '../../components/TrafficAnalyticsChart';
import { RecentActivityFeed } from '../../components/RecentActivityFeed';
import { SubscriptionOverview } from '../../components/SubscriptionOverview';
import { NotificationsWidget } from '../../components/NotificationsWidget';
import { DomainSummary } from '../../components/DomainSummary';
import { FormsSummary } from '../../components/FormsSummary';
import { MediaStorageSummary } from '../../components/MediaStorageSummary';
import { Globe, Users, FileText, BarChart3 } from 'lucide-react';

export function Dashboard() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, Alex!</h1>
            <p className="mt-1 text-base text-slate-600">Here's what's happening with your websites today.</p>
          </div>
          <Link 
            to="/editor/new" 
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            + New Website
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Websites"
            value="24"
            change="+12%"
            changeType="positive"
            icon={<Globe className="h-6 w-6" />}
          />
          <StatCard
            title="Published Websites"
            value="18"
            change="+8%"
            changeType="positive"
            icon={<FileText className="h-6 w-6" />}
          />
          <StatCard
            title="Draft Websites"
            value="6"
            change="-2%"
            changeType="negative"
            icon={<FileText className="h-6 w-6" />}
          />
          <StatCard
            title="Total Visitors"
            value="12.4K"
            change="+23%"
            changeType="positive"
            icon={<Users className="h-6 w-6" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrafficAnalyticsChart />
          </div>
          <div>
            <RecentActivityFeed />
          </div>
        </div>

        <RecentWebsitesTable />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <QuickActionsPanel />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <NotificationsWidget />
            <SubscriptionOverview />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DomainSummary />
          <FormsSummary />
          <MediaStorageSummary />
        </div>
      </div>
    </Layout>
  );
}