# 💬 Adding Real-Time Chat to GooDDeeD — Full Guide

## Overview

Add per-cause group chat so members of a cause can communicate in real time. This document covers architecture options, implementation steps, roadblocks, deployment, and costs — all tailored to your current stack (Spring Boot 3 + React + PostgreSQL on Railway/Vercel).

---

## 1. Architecture Options

### Option A: WebSocket via Spring Boot (Recommended for your stack)

```
React App ←→ WebSocket (STOMP/SockJS) ←→ Spring Boot ←→ PostgreSQL
```

| Pros | Cons |
|------|------|
| No new services to manage | Server holds connections in memory |
| Uses your existing auth (JWT) | Railway free tier has 512MB RAM — limits concurrent connections (~200-500) |
| Full control over logic | Need to handle reconnection logic |
| Free — no extra cost | Single-server: no horizontal scaling without Redis |

### Option B: Third-Party Chat Service (Firebase, Ably, Pusher)

```
React App ←→ Firebase Realtime DB / Ably / Pusher ←→ (optional) Spring Boot for auth
```

| Pros | Cons |
|------|------|
| Instant scalability | Vendor lock-in |
| Built-in presence, typing indicators | Free tiers have limits |
| Less backend code | Data lives outside your DB |

### Option C: Dedicated WebSocket Service (Socket.io on separate server)

```
React App ←→ Socket.io (Node.js) ←→ Redis ←→ PostgreSQL
                                    ↕
                              Spring Boot (REST API)
```

| Pros | Cons |
|------|------|
| Decoupled, scales independently | Extra service to deploy & maintain |
| Socket.io handles reconnection | Need Redis for pub/sub across instances |
| Node.js excels at WebSockets | More complex architecture |

> **Recommendation:** Go with **Option A** (Spring Boot WebSocket). It fits your stack, costs nothing extra, and is sufficient for your scale. Move to Option C only if you outgrow Railway's memory limits.

---

## 2. Implementation Plan (Option A)

### 2.1 Database Schema

New Flyway migration `V4__Chat_messages.sql`:

```sql
-- Chat rooms are 1:1 with causes (each cause = one chat room)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_cause_id ON chat_messages(cause_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_cause_created ON chat_messages(cause_id, created_at DESC);
```

### 2.2 Backend Changes

#### New Dependencies (`pom.xml`)

```xml
<!-- WebSocket support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

#### New Files to Create

| File | Purpose |
|------|---------|
| `model/ChatMessage.java` | JPA entity for chat messages |
| `dto/ChatMessageDTO.java` | Message transfer object (id, senderName, content, timestamp) |
| `dto/SendMessageRequest.java` | Incoming message payload |
| `repository/ChatMessageRepository.java` | JPA repo with paginated queries |
| `service/ChatService.java` | Business logic: save, fetch, validate membership |
| `config/WebSocketConfig.java` | STOMP + SockJS endpoint configuration |
| `controller/ChatWebSocketController.java` | `@MessageMapping` handlers |
| `controller/ChatRestController.java` | REST endpoints for message history |
| `security/WebSocketAuthInterceptor.java` | Extract JWT from WebSocket handshake |

#### WebSocket Config (key parts)

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");  // Messages go to /topic/cause/{causeId}
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("https://your-vercel-app.vercel.app", "http://localhost:5173")
                .withSockJS();  // Fallback for browsers without WebSocket
    }
}
```

#### Message Flow

```
1. User connects:  React → SockJS → /ws (handshake with JWT)
2. User sends:     React → /app/chat.send/{causeId} → ChatWebSocketController
3. Server saves:   ChatService → ChatMessageRepository → PostgreSQL
4. Server broadcasts: → /topic/cause/{causeId} → All subscribed members
5. History load:   React → GET /api/causes/{causeId}/messages?page=0 → ChatRestController
```

### 2.3 Frontend Changes

#### New Dependencies

```bash
npm install @stomp/stompjs sockjs-client
```

#### New Files to Create

| File | Purpose |
|------|---------|
| `hooks/useWebSocket.js` | Custom hook: connect, subscribe, send, reconnect |
| `components/chat/ChatPanel.jsx` | Main chat UI component |
| `components/chat/ChatMessage.jsx` | Single message bubble |
| `components/chat/ChatInput.jsx` | Message input with send button |
| `api/chat.js` | REST API calls for message history |
| `pages/CauseDetailPage.jsx` | Modified — add chat tab/panel |
| `styles/ChatPanel.css` | Chat-specific styles |

#### React WebSocket Hook (key parts)

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function useWebSocket(causeId, onMessage) {
    const clientRef = useRef(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_URL}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe(`/topic/cause/${causeId}`, (msg) => {
                    onMessage(JSON.parse(msg.body));
                });
            },
            reconnectDelay: 5000,
        });
        client.activate();
        clientRef.current = client;
        return () => client.deactivate();
    }, [causeId]);

    const sendMessage = (content) => {
        clientRef.current.publish({
            destination: `/app/chat.send/${causeId}`,
            body: JSON.stringify({ content }),
        });
    };

    return { sendMessage };
}
```

---

## 3. Roadblocks & Solutions

### 🔴 Critical Roadblocks

| Roadblock | Impact | Solution |
|-----------|--------|----------|
| **Vercel doesn't support WebSockets** | Frontend can't proxy WS through Vercel | Connect directly to Railway backend URL for WebSocket. REST API can still go through Vercel proxy |
| **Railway free tier: 512MB RAM** | Each WebSocket holds ~10-50KB in memory. Max ~5,000-10,000 concurrent connections | Sufficient for early stage. Add connection limits. Upgrade Railway if needed ($5/mo for 8GB) |
| **JWT expiry during long WS sessions** | Connection drops after token expires | Implement token refresh over WebSocket or disconnect + reconnect with new token |
| **CORS for WebSocket** | Browser blocks WS to different origin | Configure `setAllowedOrigins()` in WebSocketConfig with your Vercel domain |

### 🟡 Moderate Roadblocks

| Roadblock | Impact | Solution |
|-----------|--------|----------|
| **Message ordering** | Messages could arrive out of order | Use `created_at` timestamp from server, sort on frontend |
| **Reconnection handling** | Users lose messages while disconnected | On reconnect, fetch missed messages via REST (last timestamp → now) |
| **Rate limiting for chat** | Spam/abuse via WebSocket | Add per-user message rate limit (e.g., 30 messages/minute) in `ChatService` |
| **Large chat history** | Slow page loads | Paginate messages (20 per page), infinite scroll up |
| **No horizontal scaling** | Can't run multiple backend instances | Use Redis pub/sub as message broker instead of simple broker (only needed if you scale) |

### 🟢 Minor Roadblocks

| Roadblock | Impact | Solution |
|-----------|--------|----------|
| **Typing indicators** | Nice-to-have UX | Send ephemeral STOMP messages (don't persist) |
| **Online presence** | Show who's online | Track WebSocket sessions in memory map |
| **Read receipts** | Know if message was seen | Add `read_at` column, update via REST |

---

## 4. Step-by-Step Implementation Order

```
Phase 1: Core Chat (1-2 days)
├── V4 migration (chat_messages table)
├── ChatMessage entity + repository
├── ChatService (save, fetch with pagination)
├── ChatRestController (GET message history)
├── WebSocketConfig + auth interceptor
├── ChatWebSocketController (send/receive)
└── Basic ChatPanel component in CauseDetailPage

Phase 2: Polish (1 day)
├── Message bubbles with sender name, timestamp
├── Auto-scroll to bottom on new message
├── "Load more" for older messages
├── Connection status indicator
└── Reconnection logic

Phase 3: Optional Enhancements (1-2 days)
├── Typing indicators
├── Online/offline presence
├── Unread message count badge
├── Push notifications (via service worker)
└── Message reactions
```

---

## 5. Deployment

### Backend (Railway)

**No extra configuration needed.** Railway supports WebSocket connections natively.

Changes to deploy:
1. Push code to `main` → Railway auto-deploys
2. The V4 migration runs automatically via Flyway on startup
3. WebSocket endpoint is available at `wss://your-railway-app.up.railway.app/ws`

> [!WARNING]
> **Vercel frontend must connect DIRECTLY to Railway's WebSocket URL**, not through Vercel's proxy. Vercel's serverless functions don't support persistent WebSocket connections.

### Frontend (Vercel)

Update environment variable:
```
VITE_WS_URL=wss://your-railway-app.up.railway.app/ws
VITE_API_URL=https://your-railway-app.up.railway.app/api  (existing)
```

No other Vercel config changes needed.

---

## 6. Cost Breakdown

### Current Setup (Free)

| Service | Free Tier | Chat Impact |
|---------|-----------|-------------|
| **Railway** (Backend) | $5 credit/month, 512MB RAM, 1 vCPU | WebSocket connections use ~10-50KB each. Free tier handles ~200-500 concurrent chatting users |
| **Railway** (PostgreSQL) | Included in $5 credit | Chat messages add ~0.5KB per message. 100K messages ≈ 50MB. Free tier has 1GB storage |
| **Vercel** (Frontend) | 100GB bandwidth, unlimited deploys | No change — chat traffic goes directly to Railway |

### When You'd Need to Pay

| Scenario | Trigger | Cost |
|----------|---------|------|
| **>500 concurrent WS connections** | Railway RAM > 512MB | Railway Hobby: **$5/month** (8GB RAM) |
| **>1M chat messages stored** | PostgreSQL > 1GB | Railway disk: **$0.25/GB/month** |
| **Need horizontal scaling** | Single server can't handle load | Add Redis: **$5/month** on Railway + second backend instance |
| **Push notifications** | Want mobile/browser push | Firebase Cloud Messaging: **Free** (up to 1M/month) |

### Estimated Costs by Scale

| Scale | Monthly Cost |
|-------|-------------|
| **MVP / Testing** (< 100 users) | **$0** (free tier) |
| **Small community** (100-1,000 users) | **$0-5** (may hit Railway limits) |
| **Growing** (1,000-10,000 users) | **$10-20** (Railway Hobby + Redis) |
| **Large** (10,000+ users) | **$50+** (consider dedicated WebSocket service or Ably/Pusher) |

### Third-Party Alternative Costs (for comparison)

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Firebase Realtime DB** | 100 concurrent connections, 1GB storage | $25/month (Blaze plan, pay-as-you-go) |
| **Ably** | 6M messages/month, 200 concurrent | $29/month (standard) |
| **Pusher** | 200K messages/day, 100 connections | $49/month (startup) |

---

## 7. Summary Decision Matrix

| Factor | Self-hosted (Option A) | Firebase | Ably/Pusher |
|--------|----------------------|----------|-------------|
| **Initial cost** | $0 | $0 | $0 |
| **Scale cost** | $5-20/mo | $25+/mo | $29-49/mo |
| **Implementation time** | 2-4 days | 1-2 days | 1-2 days |
| **Control** | Full | Limited | Limited |
| **Fits current stack** | ✅ Perfect | ⚠️ Adds Firebase SDK | ⚠️ Adds vendor SDK |
| **Data ownership** | ✅ Your PostgreSQL | ❌ Firebase servers | ❌ Vendor servers |
| **Offline/reconnect** | Manual | Built-in | Built-in |

> **Bottom line:** For GooDDeeD's current scale and budget, **self-hosted WebSocket via Spring Boot (Option A)** is the clear winner — zero extra cost, full control, and fits your existing stack perfectly. You'd only need to consider third-party services if you scale past ~10,000 concurrent users.
