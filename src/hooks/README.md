# Supabase Realtime Hooks - Best Practices SOTA 2025

## 🎯 Pattern officiel de cleanup

### ✅ CORRECT (SOTA 2025)

```typescript
useEffect(() => {
  if (!groupId || !user) return;

  // 1. Créer un nom de canal UNIQUE avec timestamp + random
  const channelName = `my-channel-${groupId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'my_table',
      filter: `id=eq.${groupId}`
    }, (payload) => {
      // Handler logic
    })
    .subscribe();

  return () => {
    // 2. TOUJOURS cleanup dans cet ordre:
    channel.unsubscribe();       // ✅ 1. Unsubscribe FIRST
    supabase.removeChannel(channel); // ✅ 2. Remove channel AFTER
  };
}, [groupId, user?.id]); // ✅ Dépendances stables uniquement
```

### ✅ CORRECT pour Presence channels

```typescript
useEffect(() => {
  if (!groupId || !user) return;

  const channelName = `presence-${groupId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const channel = supabase.channel(channelName, {
    config: { presence: { key: user.id } }
  });

  channel
    .on('presence', { event: 'sync' }, handler)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, ... });
      }
    });

  return () => {
    // ✅ Pour presence, 3 étapes:
    channel.untrack();           // 1. Untrack presence
    channel.unsubscribe();       // 2. Unsubscribe
    supabase.removeChannel(channel); // 3. Remove channel
  };
}, [groupId, user?.id]);
```

---

## ❌ Anti-patterns à éviter

### ❌ INCORRECT: Pas d'unsubscribe

```typescript
return () => {
  supabase.removeChannel(channel); // ❌ ERREUR: manque unsubscribe()
};
```

**Problème**: Provoque l'erreur `"tried to subscribe multiple times"` en React Strict Mode.

---

### ❌ INCORRECT: Réutilisation de canal

```typescript
const channelName = `my-channel-${groupId}`; // ❌ Pas unique
```

**Problème**: Risque de collision si le composant remonte rapidement.

---

### ❌ INCORRECT: Callbacks dans les dépendances

```typescript
useEffect(() => {
  // ...
}, [groupId, updateCache, invalidate]); // ❌ Callbacks causent re-render
```

**Solution**: Utiliser des `useRef` pour les callbacks:

```typescript
const updateCacheRef = useRef(updateCache);
const invalidateRef = useRef(invalidate);

useEffect(() => {
  updateCacheRef.current = updateCache;
  invalidateRef.current = invalidate;
}, [updateCache, invalidate]);

useEffect(() => {
  // Utiliser updateCacheRef.current au lieu de updateCache
}, [groupId]); // ✅ Pas de callbacks dans les deps
```

---

## 📚 Sources SOTA Octobre 2025

1. **Supabase Official Docs** - [Realtime Cleanup](https://supabase.com/docs/guides/realtime/cleanup)
2. **GitHub Issue #12845** - "Multiple subscriptions error in React Strict Mode"
3. **Stack Overflow** - "Best practices for Supabase channel lifecycle"
4. **Supabase Cache Helpers** - Advanced patterns pour React Query + Realtime

---

## 🧪 Checklist de validation

Avant de merge un hook Realtime, vérifier:

- [ ] Nom de canal unique avec `Date.now()` + `Math.random()`
- [ ] `channel.unsubscribe()` appelé AVANT `removeChannel()`
- [ ] Pour presence: `untrack()` > `unsubscribe()` > `removeChannel()`
- [ ] Pas de callbacks dans les dépendances du `useEffect`
- [ ] Test avec React Strict Mode activé (dev)
- [ ] Aucune erreur "tried to subscribe multiple times" dans la console

---

## 🚀 Optimisations avancées

### AbortController pour opérations critiques

```typescript
useEffect(() => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  if (signal.aborted) return;
  
  const channel = supabase.channel('...');
  // ... setup
  
  return () => {
    abortController.abort(); // Signal d'abandon
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}, [groupId]);
```

### Retry logic avec exponential backoff

```typescript
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') {
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    setTimeout(() => invalidateMessages(), retryDelay);
  }
});
```

---

**Dernière mise à jour**: Janvier 2025 (SOTA Octobre 2025 appliqué)
