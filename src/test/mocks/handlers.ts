import { http, HttpResponse } from "msw";

const API_URL = "/api";

export const handlers = [
  // Auth
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        createdAt: "2025-01-01T00:00:00Z",
      },
    });
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };
    if (body.email === "test@example.com" && body.password === "password") {
      return HttpResponse.json({
        data: {
          id: "test-user-id",
          email: "test@example.com",
          nickname: "Test User",
          createdAt: "2025-01-01T00:00:00Z",
        },
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      nickname: string;
    };
    return HttpResponse.json({
      data: {
        id: "new-user-id",
        email: body.email,
        nickname: body.nickname,
        createdAt: new Date().toISOString(),
      },
    });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({
      data: { message: "Logged out successfully" },
    });
  }),

  http.patch(`${API_URL}/auth/me`, async ({ request }) => {
    const body = (await request.json()) as {
      nickname?: string;
      avatarUrl?: string;
    };
    return HttpResponse.json({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: body.nickname || "Test User",
        avatarUrl: body.avatarUrl,
        createdAt: "2025-01-01T00:00:00Z",
      },
    });
  }),

  http.post(`${API_URL}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      data: { message: "Password reset email sent" },
    });
  }),

  // Projects
  http.get(`${API_URL}/projects`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "project-1",
          title: "Test Project",
          description: "Test Description",
          genre: "fantasy",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          order: 0,
        },
      ],
    });
  }),

  http.get(`${API_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        title: "Test Project",
        description: "Test Description",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        order: 0,
      },
    });
  }),

  http.get(`${API_URL}/projects/:id/stats`, () => {
    return HttpResponse.json({
      data: {
        wordCount: 5000,
        characterCount: 3,
        documentCount: 10,
        foreshadowingCount: 5,
      },
    });
  }),

  http.post(`${API_URL}/projects`, async ({ request }) => {
    const body = (await request.json()) as { title: string; genre?: string };
    return HttpResponse.json({
      data: {
        id: "new-project-id",
        title: body.title,
        description: "",
        genre: body.genre || "fantasy",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    });
  }),

  http.post(`${API_URL}/projects/:id/duplicate`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: `${params.id}-copy`,
        title: "Test Project (Copy)",
        description: "",
        genre: "fantasy",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
      },
    });
  }),

  http.patch(`${API_URL}/projects/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { title?: string };
    return HttpResponse.json({
      data: {
        id: params.id,
        title: body.title || "Updated Project",
        description: "",
        genre: "fantasy",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    });
  }),

  http.delete(`${API_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({ data: { id: params.id } });
  }),

  // Documents Tree
  http.get(`${API_URL}/projects/:projectId/documents`, ({ params }) => {
    return HttpResponse.json({
      data: [
        {
          id: "doc-1",
          projectId: params.projectId,
          title: "Chapter 1",
          type: "folder",
          content: "",
          synopsis: "",
          order: 0,
          status: "draft",
          wordCount: 0,
          includeInCompile: true,
          keywords: [],
          notes: "",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          children: [
            {
              id: "doc-2",
              projectId: params.projectId,
              title: "Scene 1",
              type: "text",
              content: "<p>Test content</p>",
              synopsis: "Test synopsis",
              order: 0,
              status: "draft",
              wordCount: 2,
              includeInCompile: true,
              keywords: [],
              notes: "",
              createdAt: "2025-01-01T00:00:00Z",
              updatedAt: "2025-01-01T00:00:00Z",
            },
          ],
        },
      ],
    });
  }),

  // Document CRUD
  http.get(`${API_URL}/documents/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        projectId: "project-1",
        title: "Test Document",
        type: "text",
        content: "",
        synopsis: "",
        order: 0,
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });
  }),

  http.post(
    `${API_URL}/projects/:projectId/documents`,
    async ({ params, request }) => {
      const body = (await request.json()) as {
        projectId: string;
        type: string;
        title: string;
      };
      return HttpResponse.json({
        data: {
          id: "new-doc-id",
          projectId: params.projectId,
          title: body.title,
          type: body.type,
          content: "",
          synopsis: "",
          order: 0,
          status: "draft",
          wordCount: 0,
          includeInCompile: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
  ),

  http.patch(`${API_URL}/documents/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { title?: string; content?: string };
    return HttpResponse.json({
      data: {
        id: params.id,
        title: body.title || "Updated Document",
        content: body.content || "",
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/documents/:id`, ({ params }) => {
    return HttpResponse.json({ data: { id: params.id } });
  }),

  http.get(`${API_URL}/documents/:id/content`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        content: "<p>Test content</p>",
      },
    });
  }),

  http.patch(
    `${API_URL}/documents/:id/content`,
    async ({ params, request }) => {
      const body = (await request.json()) as { content: string };
      return HttpResponse.json({
        data: {
          id: params.id,
          wordCount: body.content.length,
          updatedAt: new Date().toISOString(),
        },
      });
    },
  ),

  http.post(`${API_URL}/documents/reorder`, async () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  http.post(`${API_URL}/documents/bulk-update`, async () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  // Characters
  http.get(`${API_URL}/projects/:projectId/characters`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "char-1",
          name: "홍길동",
          description: "Test character",
          imageUrl: "",
          extras: {},
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.get(`${API_URL}/characters/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        name: "홍길동",
        description: "Test character",
        imageUrl: "",
        extras: {},
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });
  }),

  http.post(
    `${API_URL}/projects/:projectId/characters`,
    async ({ request, params }) => {
      const body = (await request.json()) as { name: string };
      return HttpResponse.json({
        data: {
          id: "new-char-id",
          projectId: params.projectId,
          name: body.name,
          description: "",
          imageUrl: "",
          extras: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
  ),

  http.patch(`${API_URL}/characters/:id`, async ({ params, request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
    };
    return HttpResponse.json({
      data: {
        id: params.id,
        name: body.name || "Updated Character",
        description: body.description || "",
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/characters/:id`, ({ params }) => {
    return HttpResponse.json({ data: { id: params.id } });
  }),

  http.post(`${API_URL}/characters/:id/regenerate`, () => {
    return HttpResponse.json({
      data: {
        jobId: "job-123",
        status: "pending",
      },
    });
  }),

  // Foreshadowing
  http.get(`${API_URL}/projects/:projectId/foreshadowing`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "Test foreshadowing",
          status: "active",
          importance: "high",
          appearances: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.get(`${API_URL}/projects/:projectId/foreshadowing/unresolved`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "foreshadow-2",
          projectId: "project-1",
          tag: "미해결_복선",
          description: "Unresolved",
          status: "active",
          importance: "medium",
          appearances: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.get(`${API_URL}/foreshadowing/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        projectId: "project-1",
        tag: "테스트_복선",
        description: "Detail",
        status: "active",
        importance: "high",
        appearances: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    });
  }),

  http.post(
    `${API_URL}/projects/:projectId/foreshadowing`,
    async ({ params, request }) => {
      const body = (await request.json()) as { tag: string };
      return HttpResponse.json({
        data: {
          id: "new-foreshadow-id",
          projectId: params.projectId,
          tag: body.tag,
          description: "",
          status: "active",
          importance: "medium",
          appearances: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
  ),

  http.patch(`${API_URL}/foreshadowing/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { tag?: string; status?: string };
    return HttpResponse.json({
      data: {
        id: params.id,
        tag: body.tag || "Updated",
        status: body.status || "active",
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/foreshadowing/:id`, ({ params }) => {
    return HttpResponse.json({ data: { id: params.id } });
  }),

  http.post(`${API_URL}/foreshadowing/:id/appearances`, async ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        appearances: [
          {
            chapterId: "chapter-1",
            chapterTitle: "Chapter 1",
            line: 42,
            context: "Test context",
          },
        ],
      },
    });
  }),

  http.patch(`${API_URL}/foreshadowing/:id/recover`, async ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: "recovered",
      },
    });
  }),

  // Relationships
  http.get(`${API_URL}/projects/:projectId/relationships`, () => {
    return HttpResponse.json([
      {
        id: "rel-1",
        sourceId: "char-1",
        targetId: "char-2",
        type: "friendly",
        strength: 5,
        description: "Friends",
        createdAt: "2025-01-01T00:00:00Z",
      },
    ]);
  }),
];
