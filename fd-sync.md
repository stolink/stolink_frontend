Frontend Integration Guide: Event API Update
The backend
Event
entity and response structure have been updated. Please apply the following changes to your Frontend codebase (likely stolink_frontend or similar).

1. Update
   Event
   Interface
   Locate your TypeScript interface for Event (e.g., src/types/event.ts or src/services/eventService.ts) and add the project_id field.

// src/types/event.ts (or wherever Event is defined)
export interface BackendEvent {
id: string; // UUID from DB
eventId: string; // E001, etc.
name: string;
eventType: string;
description: string;
participants: string[];
chapter?: number;
sequenceOrder?: number;
narrativeSummary?: string;
importance?: number;
locationRef?: string;
startTime?: string;
endTime?: string;
documentId?: string;
// [NEW] Strictly using snake_case as requested
project_id: string;
} 2. Usage in Components
You can now safely access project_id directly.

// Example usage
const eventsForProject = events.filter(e => e.project_id === currentProjectId);
console.log("Event Project ID:", event.project_id); 3. Verify API Response
The GET /api/characters/:id/events endpoint returns the following JSON structure:

{
"code": 200,
"status": "OK",
"message": "OK",
"data": [
{
"id": "...",
"eventId": "E001",
"project_id": "cd250a32-...",
"participants": ["..."],
...
}
]
}
