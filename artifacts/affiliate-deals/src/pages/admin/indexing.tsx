import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListIndexingQueue, 
  useRetryIndexingItem,
  getListIndexingQueueQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminIndexing() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { 
    page, 
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}) 
  };
  
  const { data, isLoading } = useListIndexingQueue(queryParams);
  const retryMutation = useRetryIndexingItem();

  const handleRetry = (id: number) => {
    retryMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Item queued for retry." });
        queryClient.invalidateQueries({ queryKey: getListIndexingQueueQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to retry item", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Sent</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case "pending": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indexing Queue</h1>
          <p className="text-muted-foreground mt-1">Manage search engine indexing submissions.</p>
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[200px] md:max-w-[300px] truncate" title={item.url}>
                    {item.url}
                    {item.errorMessage && (
                      <div className="text-xs text-destructive mt-1 truncate" title={item.errorMessage}>
                        {item.errorMessage}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.attempts}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.scheduledAt ? format(new Date(item.scheduledAt), "PPp") : "-"}
                  </TableCell>
                  <TableCell>
                    {item.status === "failed" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRetry(item.id)}
                        disabled={retryMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No queue items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} items
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
