import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  strengthRating: number;
};

type PredictResponse = {
  teams: { a: Team; b: Team };
  expectedGoals: { a: number; b: number };
  probabilities: { winA: number; draw: number; winB: number };
  predictedScore: { a: number; b: number };
};

export default function FootballPredict() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const [, navigate] = useLocation();

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [countryCode, setCountryCode] = useState<string>("");

  const [teamAId, setTeamAId] = useState<number | "">("");
  const [teamBId, setTeamBId] = useState<number | "">("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingTeams(true);
      try {
        const res = await fetch("/api/football/teams", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load teams");
        const data = await res.json();
        const items: Team[] = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) {
          setTeams(items);
          const codes = Array.from(new Set(items.map((t) => t.countryCode)));
          if (codes.length > 0) setCountryCode(codes[0]);
        }
      } catch (e) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: e instanceof Error ? e.message : "Failed to load teams",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    // reset picks when country changes
    setTeamAId("");
    setTeamBId("");
    setResult(null);
  }, [countryCode]);

  const countryCodes = useMemo(() => {
    return Array.from(new Set(teams.map((t) => t.countryCode))).sort();
  }, [teams]);

  const teamsForCountry = useMemo(() => {
    return teams.filter((t) => t.countryCode === countryCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, countryCode]);

  const selectedTeamA = useMemo(() => {
    if (teamAId === "") return null;
    return teams.find((t) => t.id === teamAId) ?? null;
  }, [teams, teamAId]);

  const selectedTeamB = useMemo(() => {
    if (teamBId === "") return null;
    return teams.find((t) => t.id === teamBId) ?? null;
  }, [teams, teamBId]);

  const onAnalyze = async () => {
    if (!selectedTeamA || !selectedTeamB) {
      toast({ title: "Missing teams", description: "Pick Team A and Team B", variant: "destructive" });
      return;
    }
    if (selectedTeamA.id === selectedTeamB.id) {
      toast({ title: "Invalid choice", description: "Pick two different teams", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/football/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamAId: selectedTeamA.id, teamBId: selectedTeamB.id }),
      });

      if (res.status === 401) {
        setLoginDialogOpen(true);
        return;
      }

      if (res.status === 429) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Limit reached",
          description: err?.error ?? "10 predictions per 24 hours",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Prediction failed");
      }

      const data = (await res.json()) as PredictResponse;
      setResult(data);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Prediction failed",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = !!selectedTeamA && !!selectedTeamB && selectedTeamA.id !== selectedTeamB.id && !isAnalyzing;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Football Match Predictor (MVP)</h1>
        <p className="text-muted-foreground mt-2">Pick a country, select two teams, then analyze.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Country</div>
                {loadingTeams ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={countryCode} onValueChange={(v) => setCountryCode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Sport</div>
                <div className="h-10 flex items-center px-3 rounded border bg-muted">
                  Football
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Team A</div>
                {loadingTeams ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={teamAId === "" ? undefined : String(teamAId)}
                    onValueChange={(v) => setTeamAId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick Team A" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsForCountry.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Team B</div>
                {loadingTeams ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={teamBId === "" ? undefined : String(teamBId)}
                    onValueChange={(v) => setTeamBId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick Team B" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsForCountry.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Button onClick={onAnalyze} disabled={!canAnalyze} className="w-full sm:w-auto">
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>

              <div className="text-sm text-muted-foreground text-center sm:text-right">
                Requires login. Limit: <span className="font-semibold">10</span> predictions / 24h.
              </div>
            </div>

            {result && (
              <div className="mt-8">
                <div className="text-lg font-bold mb-3">Prediction Result</div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Expected Goals</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{result.teams.a.name}</TableCell>
                      <TableCell className="text-right">{result.expectedGoals.a.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(result.probabilities.winA * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{result.teams.b.name}</TableCell>
                      <TableCell className="text-right">{result.expectedGoals.b.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(result.probabilities.winB * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Draw</TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">{(result.probabilities.draw * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="mt-4 rounded border bg-muted p-4">
                  <div className="text-sm text-muted-foreground">Predicted Score</div>
                  <div className="text-3xl font-black leading-none mt-1">
                    {result.predictedScore.a} - {result.predictedScore.b}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6">
            <div className="text-lg font-bold">How it works</div>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              MVP uses a strength rating per team to model expected goals and estimate win/draw probabilities.
              Admin can later resolve actual scores to build real analytics.
            </p>

            <div className="mt-5">
              <div className="text-sm font-medium mb-2">Selected</div>
              <div className="space-y-2 text-sm">
                <div>
                  Team A: <span className="font-semibold">{selectedTeamA ? selectedTeamA.name : "-"}</span>
                </div>
                <div>
                  Team B: <span className="font-semibold">{selectedTeamB ? selectedTeamB.name : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login required</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            You must login to run predictions (cookies required).
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setLoginDialogOpen(false);
                navigate("/admin/login");
              }}
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
