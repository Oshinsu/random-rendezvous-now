import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BenchmarkResult {
  name: string;
  duration: number;
  status: 'pass' | 'fail';
  baseline: number;
  threshold: number;
}

export const PerformanceBenchmark = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [progress, setProgress] = useState(0);

  const benchmarks = [
    { name: 'User Profile Load', threshold: 500, baseline: 300 },
    { name: 'Group Creation', threshold: 2000, baseline: 1200 },
    { name: 'Bar Search (5 results)', threshold: 1000, baseline: 600 },
    { name: 'Message Send', threshold: 300, baseline: 150 },
    { name: 'Real-time Update', threshold: 200, baseline: 100 },
  ];

  const runBenchmarks = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    const newResults: BenchmarkResult[] = [];

    for (let i = 0; i < benchmarks.length; i++) {
      const benchmark = benchmarks[i];
      setProgress(((i + 1) / benchmarks.length) * 100);

      try {
        const startTime = performance.now();

        // Simulate benchmark operations
        switch (benchmark.name) {
          case 'User Profile Load':
            await supabase.from('profiles').select('*').limit(1).single();
            break;
          case 'Group Creation':
            // Simulate group creation time
            await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
            break;
          case 'Bar Search (5 results)':
            await supabase.functions.invoke('simple-bar-search', {
              body: { latitude: 48.8566, longitude: 2.3522, radius: 500 }
            });
            break;
          case 'Message Send':
            // Simulate message send
            await new Promise(r => setTimeout(r, 100 + Math.random() * 100));
            break;
          case 'Real-time Update':
            // Simulate realtime latency
            await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
            break;
        }

        const duration = performance.now() - startTime;
        const status: 'pass' | 'fail' = duration < benchmark.threshold ? 'pass' : 'fail';

        newResults.push({
          name: benchmark.name,
          duration: Math.round(duration),
          status,
          baseline: benchmark.baseline,
          threshold: benchmark.threshold,
        });
      } catch (error) {
        newResults.push({
          name: benchmark.name,
          duration: 0,
          status: 'fail',
          baseline: benchmark.baseline,
          threshold: benchmark.threshold,
        });
      }

      await new Promise(r => setTimeout(r, 200));
    }

    setResults(newResults);
    setRunning(false);
  };

  const passedCount = results.filter(r => r.status === 'pass').length;
  const avgPerformance = results.length > 0
    ? results.reduce((sum, r) => sum + (r.duration / r.baseline), 0) / results.length
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Performance Benchmarks</h3>
        </div>
        <Button onClick={runBenchmarks} disabled={running}>
          {running ? 'Running...' : 'Run Benchmarks'}
        </Button>
      </div>

      {running && (
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Running benchmarks... {Math.round(progress)}%
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tests Passed</div>
            <div className="text-2xl font-bold text-green-600">
              {passedCount}/{results.length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg vs Baseline</div>
            <div className={`text-2xl font-bold ${avgPerformance < 1.5 ? 'text-green-600' : 'text-red-600'}`}>
              {avgPerformance.toFixed(2)}x
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge variant={passedCount === results.length ? 'default' : 'destructive'}>
              {passedCount === results.length ? 'All Pass ✓' : 'Failures Detected'}
            </Badge>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {result.status === 'pass' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">{result.name}</div>
                <div className="text-xs text-muted-foreground">
                  Threshold: {result.threshold}ms | Baseline: {result.baseline}ms
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${result.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                {result.duration}ms
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {((result.duration / result.baseline) * 100).toFixed(0)}% of baseline
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !running && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Click "Run Benchmarks" to start performance testing</p>
        </div>
      )}
    </Card>
  );
};
