import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

vi.mock("../../src/services/chatService.js", () => ({
  processMessage: vi.fn(),
}));

const chatService = await import("../../src/services/chatService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/chat", () => {
  it("returns 200 with reply for valid message", async () => {
    chatService.processMessage.mockResolvedValue("Your total spending this month is $2,500.");

    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID, message: "How much did I spend this month?" })
      .expect(200);

    expect(res.body).toHaveProperty("reply");
    expect(res.body.reply).toBe("Your total spending this month is $2,500.");
    expect(chatService.processMessage).toHaveBeenCalledWith(
      "How much did I spend this month?",
      USER_ID
    );
  });

  it("returns 400 when message is missing", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID })
      .expect(400);

    expect(res.body.error).toContain("Message is required");
    expect(chatService.processMessage).not.toHaveBeenCalled();
  });

  it("returns 400 when message is empty string", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID, message: "   " })
      .expect(400);

    expect(res.body.error).toContain("Message is required");
  });

  it("returns 400 when message exceeds 1000 characters", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID, message: "x".repeat(1001) })
      .expect(400);

    expect(res.body.error).toContain("1000 characters or less");
  });

  it("returns 503 when ANTHROPIC_API_KEY is not configured", async () => {
    chatService.processMessage.mockRejectedValue(new Error("ANTHROPIC_API_KEY is not configured"));

    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID, message: "Hello" })
      .expect(503);

    expect(res.body.error).toContain("AI chat is not configured");
  });

  it("returns 500 for unexpected errors", async () => {
    chatService.processMessage.mockRejectedValue(new Error("Something unexpected happened"));

    const res = await request(app)
      .post("/api/chat")
      .send({ user_id: USER_ID, message: "Hello" })
      .expect(500);

    expect(res.body.error).toBe("Failed to process chat message");
  });

  it("returns 401 when no user_id is provided", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "Hello" })
      .expect(401);

    expect(res.body.error).toBe("Authentication required");
  });
});
