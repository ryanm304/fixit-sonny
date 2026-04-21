# Project Memory

## Core
Tech: React + Vite + Tailwind + Supabase (auth, storage, RLS, realtime, AI Edge Functions).
Brand: "FixIt Sonny". Navy blue and white color scheme. JSU logo.
Navigation: Redirect root directly to auth page; no landing or introductory screens.
Realtime: Use Supabase Realtime subscriptions for instant dashboard/stat updates.
Security: All signups get 'user' role only. Admin role must be manually assigned in DB.

## Memories
- [Role-Based Access Control](mem://auth/role-based-access) — Two-tier system (Student/Admin) enforced via Supabase Row Level Security (RLS)
- [AI Chat Assistant](mem://features/ai-chat-assistant) — Gemini-powered Supabase Edge Function for user maintenance queries and request submission
- [AI Prioritization System](mem://features/ai-prioritization) — Automated evaluation assigning priority (low-urgent) and score (0-100) to requests
- [Maintenance Management](mem://features/maintenance-management) — Admin capabilities for tracking, filtering by AI urgency, and overriding priorities
- [Media Attachments](mem://features/media-attachments) — Photo attachments for maintenance requests via cloud storage
- [Notification System](mem://features/notification-system) — In-app alerts for request creation, status changes, and AI priority updates
- [User Profiles](mem://features/user-profiles) — Required organizational details (name, dorm hall, room number) for tracking
