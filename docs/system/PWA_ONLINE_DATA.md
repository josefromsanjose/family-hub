# PWA Strategy for Online Database

## Architecture Change

**Previous:** localStorage-based (offline data)
**New:** External database (online data)

**Impact:**
- Data requires internet connection
- Service worker strategy must prioritize network
- Need offline fallback UI
- Cache strategy changes significantly

## Service Worker Strategy

### Network-First for Data (Critical)

**Why:**
- Database queries need fresh data
- User actions must sync to server
- Cannot serve stale data from cache

**Implementation:**
- API calls: Network first, cache fallback only for errors
- App shell: Cache first (HTML/CSS/JS)
- Images/assets: Cache first with network update

### Caching Strategy

```javascript
// API/Data Requests: Network First
- Try network first
- If network fails → Show offline message
- Don't cache API responses (data changes)

// App Shell: Cache First
- Cache HTML, CSS, JS files
- Serve from cache immediately
- Update in background

// Static Assets: Cache First
- Cache images, fonts, etc.
- Serve from cache
- Update when online
```

## Updated Service Worker Implementation

### Key Changes Needed:

1. **Network-First for API Calls**
   - All `/api/*` routes → Network first
   - No caching of API responses
   - Show offline indicator if network fails

2. **Cache-First for App Shell**
   - HTML, CSS, JS files → Cache first
   - Enables offline app loading
   - Updates when online

3. **Offline Detection**
   - Detect when offline
   - Show offline UI
   - Queue actions for when online

4. **Background Sync** (Future)
   - Queue failed requests
   - Retry when online
   - Sync pending changes

## Implementation Plan

### Phase 1: Network-First Service Worker

**Update `public/sw.js`:**

```javascript
// Separate strategies:
// 1. API calls → Network first, no cache
// 2. App shell → Cache first
// 3. Static assets → Cache first with update
```

### Phase 2: Offline Detection

**Add to app:**
- Detect online/offline status
- Show offline indicator
- Disable actions that require network
- Show queued actions count

### Phase 3: Background Sync (Optional)

**Add if needed:**
- Queue failed API calls
- Retry when online
- Show sync status

## User Experience Considerations

### Online State:
- ✅ Full functionality
- ✅ Real-time data sync
- ✅ Instant updates

### Offline State:
- ⚠️ App loads (cached shell)
- ⚠️ Can view cached data (if any)
- ⚠️ Cannot save changes
- ⚠️ Show offline indicator
- ⚠️ Queue actions for later

### Transition States:
- Show loading indicators
- Handle network errors gracefully
- Retry failed requests
- Sync when back online

## Database Integration Considerations

### API Design:
- RESTful or GraphQL endpoints
- Authentication required
- Rate limiting
- Error handling

### Caching Strategy:
- **Don't cache:** User data, tasks, meals, etc.
- **Do cache:** App shell, static assets
- **Consider:** Cache some read-only data temporarily

### Sync Strategy:
- Real-time updates (WebSockets/SSE)
- Or polling for updates
- Conflict resolution if needed

## Updated Service Worker Code

### Network-First for Data:

```javascript
// API routes - Network first, no cache
if (event.request.url.includes('/api/')) {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Network failed - return offline response
        return new Response(
          JSON.stringify({ error: 'Offline', queued: true }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503 
          }
        );
      })
  );
  return;
}
```

### Cache-First for App Shell:

```javascript
// App shell - Cache first
if (event.request.destination === 'document' || 
    event.request.destination === 'script' ||
    event.request.destination === 'style') {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            // Cache for next time
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
            });
            return response;
          });
      })
  );
}
```

## Offline UI Components Needed

### 1. Offline Indicator
- Show when offline
- Hide when online
- Top banner or status icon

### 2. Offline Message
- Explain what's available offline
- Show queued actions count
- Retry button

### 3. Queued Actions List
- Show pending changes
- Allow cancel/retry
- Auto-sync when online

## Testing Checklist

### Online:
- [ ] Data loads from database
- [ ] Changes save immediately
- [ ] Real-time updates work
- [ ] App shell loads from cache (fast)

### Offline:
- [ ] App shell loads (cached)
- [ ] Offline indicator shows
- [ ] Cannot save changes
- [ ] Queued actions visible
- [ ] Error messages clear

### Transition:
- [ ] Going offline detected
- [ ] Going online detected
- [ ] Queued actions sync
- [ ] UI updates appropriately

## Database Options to Consider

### Option 1: Supabase
- PostgreSQL database
- Real-time subscriptions
- Built-in auth
- Free tier available
- Good for React apps

### Option 2: Firebase
- NoSQL database
- Real-time database
- Built-in auth
- Free tier available
- Easy to use

### Option 3: Custom Backend
- Full control
- Any database
- More work to set up
- More flexible

## Next Steps

1. **Choose database** (Supabase recommended)
2. **Update service worker** for network-first strategy
3. **Add offline detection** to app
4. **Implement offline UI** components
5. **Test offline/online** transitions
6. **Add background sync** (if needed)

## Key Differences from localStorage Approach

| Aspect | localStorage | Online Database |
|--------|-------------|----------------|
| **Offline Data** | ✅ Full access | ⚠️ Limited (cached only) |
| **Sync** | ❌ None | ✅ Real-time |
| **Multi-device** | ❌ Independent | ✅ Shared data |
| **Service Worker** | Optional | Required |
| **Complexity** | Low | Medium-High |
| **Cost** | Free | Database hosting |

---

**Summary:** With online database, service worker becomes critical for app shell caching and offline detection. Network-first strategy ensures fresh data while maintaining app availability.
