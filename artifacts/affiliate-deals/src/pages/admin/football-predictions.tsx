import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  strengthRating: number;
};

type Prediction = {
  id: number;
  userId: number;
  inputKey: string;
  status: string;

  predictedScoreA: number;
  predictedScoreB: number;

  expectedGoalsA: string | number;
  expectedGoalsB: string | number;

  winAProb: string | number;
  drawProb: string | number;
  winBProb: string | number;

  createdAt: string;

  actualScoreA: number | null;
  actualScoreB: number | null;

  teamA: Team | null;
  teamB: Team | null;
};

export default function AdminFootballPredictions() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Prediction[]>([]);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const [actualScoreA, setActualScoreA] = useState<number>(0);
  const [actualScoreB, setActualScoreB] = useState<number>(0);
  const [resolving, setResolving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/football/predictions?limit=50`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to load predictions");
      }
      const data = (await res.json()) as { items: Prediction[] };
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load predictions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLabel = useMemo(() => {
    if (!resolvingId) return "";
    const p = items.find((x) => x.id === resolvingId);
    if (!p) return "";
    const a = p.teamA?.name ?? p.inputKey.split("__")[0] ?? "Team A";
    const b = p.teamB?.name ?? p.inputKey.split("__")[1] ?? "Team B";
    return `${a} vs ${b}`;
  }, [items, resolvingId]);

  const openResolve = (p: Prediction) => {
    setResolvingId(p.id);
    setActualScoreA(p.actualScoreA ?? p.predictedScoreA ?? 0);
    setActualScoreB(p.actualScoreB ?? p.predictedScoreB ?? 0);
    setResolveDialogOpen(true);
  };

  const onResolve = async () => {
    if (!resolvingId) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/admin/football/predictions/${resolvingId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          actualScoreA: actualScoreA,
          actualScoreB: actualScoreB,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to resolve prediction");
      }

      toast({ title: "Resolved", description: "Actual score saved." });
      setResolveDialogOpen(false);
      setResolvingId(null);
      await load();
    } catch (e) {
      toast({
        title: "Resolve failed",
        description: e instanceof Error ? e.message : "Failed to resolve prediction",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Football Predictions</h1>
          <p className="text-muted-foreground mt-1">Resolve actual scores to build analytics later.</p>
        </div>

        <Button onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Predicted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Win / Draw / Lose</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length > 0 ? (
                items.map((p) => {
                  const matchLabel = `${p.teamA?.name ?? "Team A"} vs ${p.teamB?.name ?? "Team B"}`;

                  const winA = typeof p.winAProb === "string" ? Number(p.winAProb) : p.winAProb;
                  const draw = typeof p.drawProb === "string" ? Number(p.drawProb) : p.drawProb;
                  const winB = typeof p.winBProb === "string" ? Number(p.winBProb) : p.winBProb;

                  const winFmt = Number.isFinite(winA) ? `${(winA * 100).toFixed(1)}%` : "-";
                  const drawFmt = Number.isFinite(draw) ? `${(draw * 100).toFixed(1)}%` : "-";
                  const winBFmt = Number.isFinite(winB) ? `${(winB * 100).toFixed(1)}%` : "-";

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.id}</TableCell>
                      <TableCell>{matchLabel}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted">
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.predictedScoreA} - {p.predictedScoreB}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.actualScoreA == null || p.actualScoreB == null
                          ? "-"
                          : `${p.actualScoreA} - ${p.actualScoreB}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">
                          {winFmt} / {drawFmt} / {winBFmt}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status !== "resolved" ? (
                          <Button variant="outline" size="sm" onClick={() => openResolve(p)} disabled={resolving}>
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No predictions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve prediction</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-2">
            {selectedLabel || "Prediction"}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Actual Score A</div>
              <Input
                type="number"
                min={0}
                value={actualScoreA}
                onChange={(e) => setActualScoreA(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Actual Score B</div>
              <Input
                type="number"
                min={0}
                value={actualScoreB}
                onChange={(e) => setActualScoreB(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} disabled={resolving}>
              Cancel
            </Button>
            <Button onClick={onResolve} disabled={resolving}>
              {resolving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
