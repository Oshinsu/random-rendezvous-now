# Spécifications Dashboard CRM - AdminCRM

## 🎯 Objectif

Créer un dashboard temps réel pour monitorer la santé du CRM : automations, segments, campagnes, et user health.

---

## 📊 Widgets à Implémenter

### 1. Automation Health (Vue d'ensemble)

**Composant** : `AutomationHealthWidget.tsx`

**Métriques 24h** :
```typescript
interface AutomationHealth {
  triggers_executed: number;
  emails_sent: number;
  success_rate: number; // %
  failed_sends: number;
  avg_response_time_ms: number;
}
```

**Requête SQL** :
```sql
SELECT 
  COUNT(*) as triggers_executed,
  COUNT(*) FILTER (WHERE campaign_sent = true) as emails_sent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE campaign_sent = true) / NULLIF(COUNT(*), 0), 2) as success_rate,
  COUNT(*) FILTER (WHERE send_status = 'failed') as failed_sends
FROM crm_automation_executions
WHERE triggered_at >= NOW() - INTERVAL '24 hours';
```

**Design** :
- Cards avec stats principales
- Badge rouge si success_rate < 80%
- Bouton "View Errors" si failed_sends > 0

---

### 2. Top Active Rules (Dernière semaine)

**Composant** : `TopActiveRulesTable.tsx`

**Colonnes** :
- Rule Name
- Executions (7 jours)
- Success Rate
- Avg Delay (si applicable)
- Status (active/paused)

**Requête SQL** :
```sql
SELECT 
  r.rule_name,
  r.is_active,
  COUNT(*) as executions,
  COUNT(*) FILTER (WHERE e.campaign_sent = true) as successful_sends,
  ROUND(100.0 * COUNT(*) FILTER (WHERE e.campaign_sent = true) / NULLIF(COUNT(*), 0), 2) as success_rate
FROM crm_automation_executions e
JOIN crm_automation_rules r ON e.rule_id = r.id
WHERE e.triggered_at >= NOW() - INTERVAL '7 days'
GROUP BY r.id, r.rule_name, r.is_active
ORDER BY executions DESC
LIMIT 10;
```

---

### 3. Segment Distribution (Donut Chart)

**Composant** : `SegmentDistributionChart.tsx`

**Data** :
```sql
SELECT 
  s.segment_name,
  s.color,
  COUNT(m.user_id) as user_count
FROM crm_user_segments s
LEFT JOIN crm_user_segment_memberships m ON s.id = m.segment_id
GROUP BY s.id, s.segment_name, s.color
ORDER BY user_count DESC;
```

**Design** :
- Recharts Pie/Donut Chart
- Couleurs custom depuis DB
- Tooltip avec % et count

---

### 4. Campaign Performance (30 jours)

**Composant** : `CampaignPerformanceTable.tsx`

**Colonnes** :
- Campaign Name
- Sends (30j)
- Opens (count + %)
- Clicks (count + %)
- Conversions (count + %)
- Status

**Requête SQL** :
```sql
SELECT 
  c.campaign_name,
  c.status,
  COUNT(s.id) as total_sends,
  COUNT(s.opened_at) as opens,
  ROUND(100.0 * COUNT(s.opened_at) / NULLIF(COUNT(s.id), 0), 2) as open_rate,
  COUNT(s.clicked_at) as clicks,
  ROUND(100.0 * COUNT(s.clicked_at) / NULLIF(COUNT(s.id), 0), 2) as click_rate,
  COUNT(s.converted_at) as conversions,
  ROUND(100.0 * COUNT(s.converted_at) / NULLIF(COUNT(s.id), 0), 2) as conversion_rate
FROM crm_campaigns c
LEFT JOIN crm_campaign_sends s ON c.id = s.campaign_id
WHERE s.sent_at >= NOW() - INTERVAL '30 days' OR s.sent_at IS NULL
GROUP BY c.id, c.campaign_name, c.status
ORDER BY total_sends DESC;
```

---

### 5. Daily Sends Chart (30 jours)

**Composant** : `DailySendsChart.tsx`

**Data** :
```sql
SELECT 
  DATE(triggered_at) as date,
  COUNT(*) FILTER (WHERE campaign_sent = true) as sent,
  COUNT(*) FILTER (WHERE send_status = 'failed') as failed
FROM crm_automation_executions
WHERE triggered_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(triggered_at)
ORDER BY date DESC;
```

**Design** :
- Line chart avec 2 séries (sent, failed)
- Couleur verte pour sent, rouge pour failed
- Moyenne mobile 7 jours

---

### 6. Health Score Overview

**Composant** : `HealthScoreOverview.tsx` (existe déjà)

**Amélioration** :
- Ajouter comparaison vs semaine précédente
- Graphique évolution moyenne sur 30 jours
- Breakdown par segment

---

### 7. Recent Automation Executions (Log)

**Composant** : `RecentAutomationLog.tsx`

**Colonnes** :
- Timestamp
- Rule Name
- User (email masqué : `j***@example.com`)
- Status (success/failed)
- Error (si failed)

**Requête SQL** :
```sql
SELECT 
  e.triggered_at,
  r.rule_name,
  p.email,
  e.campaign_sent,
  e.send_status,
  e.error_message
FROM crm_automation_executions e
JOIN crm_automation_rules r ON e.rule_id = r.id
JOIN profiles p ON e.user_id = p.id
ORDER BY e.triggered_at DESC
LIMIT 50;
```

**Design** :
- Table avec pagination
- Badge rouge/vert pour status
- Bouton "View Details" → Modal avec full metadata

---

### 8. Alerts & Warnings

**Composant** : `CRMAlerts.tsx`

**Alertes automatiques** :

```typescript
interface Alert {
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}
```

**Règles d'alerte** :
- 🚨 **Critical** : Taux d'envoi < 80% (24h)
- 🚨 **Critical** : Bounce rate > 5% (7j)
- ⚠️ **Warning** : Open rate < 25% (7j)
- ⚠️ **Warning** : Unsubscribe rate > 2% (7j)
- ℹ️ **Info** : Nouveau segment créé
- ℹ️ **Info** : Campagne terminée

---

## 🎨 Layout Dashboard

### Onglet "Overview" (Vue d'ensemble)

```
┌─────────────────────────────────────────────┐
│         Automation Health (24h)             │
│  [Triggers] [Sent] [Success Rate] [Failed]  │
└─────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Segment Distribution│  Health Score        │
│  [Donut Chart]       │  [Stats + Chart]     │
└──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────┐
│         Daily Sends Chart (30d)             │
│         [Line Chart]                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Alerts & Warnings                   │
│  [List of alerts with actions]              │
└─────────────────────────────────────────────┘
```

---

### Onglet "Campaigns" (Existant, à améliorer)

**Améliorations** :
- Filtrer par status
- Trier par performance
- Bulk actions (pause/resume plusieurs)
- Quick stats hover

---

### Onglet "Automations"

```
┌─────────────────────────────────────────────┐
│         Top Active Rules (7d)               │
│  [Table avec metrics]                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Recent Executions Log               │
│  [Table avec pagination]                    │
└─────────────────────────────────────────────┘
```

---

### Onglet "Segments" (Amélioration)

**Ajouts** :
- Graph évolution user_count (30 jours)
- Bouton "Recalculate" pour forcer refresh
- Indicateur dernière maj

---

### Onglet "User Health" (Existant)

**Améliorations** :
- Filtres avancés (churn_risk + segment)
- Export CSV
- Graphique distribution scores

---

## 🔧 Hooks Nécessaires

### 1. `useAutomationHealth.ts`

```typescript
export const useAutomationHealth = () => {
  const [health, setHealth] = useState<AutomationHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    // Query automation_executions (24h)
    const { data, error } = await supabase
      .from('crm_automation_executions')
      .select('*')
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Calculate metrics
    const metrics = {
      triggers_executed: data?.length || 0,
      emails_sent: data?.filter(e => e.campaign_sent).length || 0,
      success_rate: /* calculate */,
      failed_sends: data?.filter(e => e.send_status === 'failed').length || 0
    };
    
    setHealth(metrics);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { health, loading, refetch: fetchHealth };
};
```

---

### 2. `useTopRules.ts`

```typescript
export const useTopRules = (days: number = 7) => {
  const [rules, setRules] = useState<RuleMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    // Query with JOIN automation_rules + executions
    const { data, error } = await supabase
      .rpc('get_top_automation_rules', { days_ago: days });
    
    setRules(data || []);
  };

  useEffect(() => {
    fetchRules();
  }, [days]);

  return { rules, loading, refetch: fetchRules };
};
```

**RPC à créer** :
```sql
CREATE OR REPLACE FUNCTION get_top_automation_rules(days_ago INTEGER)
RETURNS TABLE (
  rule_name TEXT,
  is_active BOOLEAN,
  executions BIGINT,
  successful_sends BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.rule_name,
    r.is_active,
    COUNT(*) as executions,
    COUNT(*) FILTER (WHERE e.campaign_sent = true) as successful_sends,
    ROUND(100.0 * COUNT(*) FILTER (WHERE e.campaign_sent = true) / NULLIF(COUNT(*), 0), 2) as success_rate
  FROM crm_automation_executions e
  JOIN crm_automation_rules r ON e.rule_id = r.id
  WHERE e.triggered_at >= NOW() - (days_ago || ' days')::INTERVAL
  GROUP BY r.id, r.rule_name, r.is_active
  ORDER BY executions DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

### 3. `useCampaignPerformance.ts`

```typescript
export const useCampaignPerformance = (days: number = 30) => {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    const { data, error } = await supabase
      .rpc('get_campaign_performance', { days_ago: days });
    
    setCampaigns(data || []);
  };

  useEffect(() => {
    fetchPerformance();
  }, [days]);

  return { campaigns, loading, refetch: fetchPerformance };
};
```

---

## 🚨 Système d'Alertes

### Composant `CRMAlerts.tsx`

**Logique** :
```typescript
const checkAlerts = async () => {
  const alerts: Alert[] = [];

  // Check 1: Taux d'envoi < 80% (24h)
  const { data: executions } = await supabase
    .from('crm_automation_executions')
    .select('*')
    .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  const successRate = executions 
    ? (executions.filter(e => e.campaign_sent).length / executions.length) * 100 
    : 100;
  
  if (successRate < 80) {
    alerts.push({
      level: 'critical',
      title: 'Taux d\'envoi critique',
      description: `Seulement ${successRate.toFixed(1)}% des automations ont envoyé un email`,
      action: 'Vérifier credentials Zoho'
    });
  }

  // Check 2: Bounce rate > 5%
  const { data: bounces } = await supabase
    .from('crm_campaign_sends')
    .select('bounced')
    .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  const bounceRate = bounces
    ? (bounces.filter(b => b.bounced).length / bounces.length) * 100
    : 0;
  
  if (bounceRate > 5) {
    alerts.push({
      level: 'critical',
      title: 'Bounce rate élevé',
      description: `${bounceRate.toFixed(1)}% des emails ont bounce`,
      action: 'Audit liste emails'
    });
  }

  // Check 3-6: Autres alertes...

  return alerts;
};
```

---

## 📈 Graphiques Recharts

### Daily Sends Chart

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart data={dailyData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line 
    type="monotone" 
    dataKey="sent" 
    stroke="#10B981" 
    name="Emails Sent" 
  />
  <Line 
    type="monotone" 
    dataKey="failed" 
    stroke="#EF4444" 
    name="Failed" 
  />
</LineChart>
```

---

### Segment Distribution Donut

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

<PieChart>
  <Pie
    data={segmentData}
    dataKey="user_count"
    nameKey="segment_name"
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={80}
    label
  >
    {segmentData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

---

## 🔄 Real-Time Updates

### Supabase Realtime Subscription

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('crm_automation_executions')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'crm_automation_executions' },
      (payload) => {
        console.log('New automation execution:', payload);
        refetchHealth(); // Refresh dashboard
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## ✅ Checklist Implémentation

### Phase 1 : Backend (RPC + Views)
- [ ] Créer RPC `get_top_automation_rules`
- [ ] Créer RPC `get_campaign_performance`
- [ ] Créer view matérialisée `crm_daily_sends` (optionnel)

### Phase 2 : Hooks
- [ ] `useAutomationHealth.ts`
- [ ] `useTopRules.ts`
- [ ] `useCampaignPerformance.ts`
- [ ] `useDailySends.ts`

### Phase 3 : Components
- [ ] `AutomationHealthWidget.tsx`
- [ ] `TopActiveRulesTable.tsx`
- [ ] `SegmentDistributionChart.tsx`
- [ ] `CampaignPerformanceTable.tsx`
- [ ] `DailySendsChart.tsx`
- [ ] `CRMAlerts.tsx`
- [ ] `RecentAutomationLog.tsx`

### Phase 4 : Integration
- [ ] Créer onglet "Overview" dans AdminCRM
- [ ] Créer onglet "Automations" dans AdminCRM
- [ ] Améliorer onglets existants
- [ ] Setup Realtime subscriptions

### Phase 5 : Testing
- [ ] Test toutes les queries avec données réelles
- [ ] Vérifier performance (< 1s loading)
- [ ] Test responsive mobile
- [ ] Test erreurs (DB down, pas de data)

---

**Dernière mise à jour** : Octobre 2025  
**Owner** : Engineering Team
