import { useGetAdminStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tag, Hexagon, Building2, FileText, MousePointerClick, 
  Activity, AlertCircle, ArrowUpRight, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return <AdminLayout>Failed to load stats.</AdminLayout>;

  const statCards = [
    { title: "Total Offers", value: stats.totalOffers, icon: Tag, color: "text-blue-500", desc: `${stats.activeOffers} active, ${stats.featuredOffers} featured` },
    { title: "Categories", value: stats.totalCategories, icon: Hexagon, color: "text-purple-500", desc: "Active categories" },
    { title: "Brands", value: stats.totalBrands, icon: Building2, color: "text-indigo-500", desc: "Active brands" },
    { title: "Blog Posts", value: stats.totalBlogPosts, icon: FileText, color: "text-pink-500", desc: `${stats.publishedBlogPosts} published` },
    { title: "Total Clicks", value: stats.totalClicks, icon: MousePointerClick, color: "text-orange-500", desc: "All-time outbound clicks" },
    { title: "Indexing Pending", value: stats.pendingIndexing, icon: Activity, color: "text-amber-500", desc: "Awaiting submission" },
    { title: "Indexing Failed", value: stats.failedIndexing, icon: AlertCircle, color: "text-red-500", desc: "Require attention" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and statistics.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Clicked Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topOffers.length > 0 ? (
              <div className="space-y-4">
                {stats.topOffers.map(offer => (
                  <div key={offer.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/offers/${offer.slug}`} className="font-medium hover:underline hover:text-primary">
                        {offer.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">{offer.brandName} &bull; {offer.categoryName}</div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-orange-500">
                      <MousePointerClick className="h-4 w-4" />
                      {offer.clickCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No data available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Added Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOffers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOffers.map(offer => (
                  <div key={offer.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/offers/${offer.slug}`} className="font-medium hover:underline hover:text-primary">
                        {offer.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {offer.isActive && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
                      {offer.isFeatured && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Featured</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
