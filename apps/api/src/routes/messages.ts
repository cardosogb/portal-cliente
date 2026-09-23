import { Router } from "express";
import { mockMessages } from "@portal/shared";
import { requireAuth, type AuthedRequest } from "../auth";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

const messages = [...mockMessages];

messagesRouter.get("/:processId", (req, res) => {
  const list = messages.filter((m) => m.processId === req.params.processId);
  return res.json({ messages: list });
});

messagesRouter.post("/:processId", (req: AuthedRequest, res) => {
  const { text } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Mensagem vazia." });
  }
  const message = {
    id: `msg_${Date.now()}`,
    processId: req.params.processId,
    authorRole: "cliente" as const,
    authorName: "Você",
    text,
    sentAt: new Date().toISOString(),
    read: false,
  };
  messages.push(message);
  return res.status(201).json({ message });
});
