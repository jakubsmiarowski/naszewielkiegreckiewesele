import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminAccess } from "./adminAuth";
import { writeAuditLog } from "./audit";

const QUESTION_STATUS = v.union(v.literal("pending"), v.literal("answered"));

function normalizeRequired(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Pole ${field} jest wymagane.`);
  }
  return normalized;
}

export const listPublic = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("qaQuestions"),
      _creationTime: v.number(),
      askerDisplayName: v.optional(v.string()),
      question: v.string(),
      answer: v.optional(v.string()),
      status: QUESTION_STATUS,
      createdAt: v.number(),
      answeredAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const questions = await ctx.db.query("qaQuestions").collect();
    return questions
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((question) => ({
        _id: question._id,
        _creationTime: question._creationTime,
        askerDisplayName: question.askerDisplayName,
        question: question.question,
        answer: question.answer,
        status: question.status,
        createdAt: question.createdAt,
        answeredAt: question.answeredAt,
      }));
  },
});

export const listForAdmin = query({
  args: {
    adminAccessToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("qaQuestions"),
      _creationTime: v.number(),
      invitationId: v.optional(v.id("invitations")),
      askerDisplayName: v.optional(v.string()),
      question: v.string(),
      answer: v.optional(v.string()),
      status: QUESTION_STATUS,
      createdAt: v.number(),
      answeredAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx, args.adminAccessToken);
    const questions = await ctx.db.query("qaQuestions").collect();
    return questions
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const submitQuestion = mutation({
  args: {
    invitationId: v.optional(v.id("invitations")),
    question: v.string(),
  },
  returns: v.id("qaQuestions"),
  handler: async (ctx, args) => {
    const question = normalizeRequired(args.question, "pytanie");

    let askerDisplayName: string | undefined;
    if (args.invitationId) {
      const invitation = await ctx.db.get(args.invitationId);
      askerDisplayName = invitation?.displayName;
    }

    return await ctx.db.insert("qaQuestions", {
      invitationId: args.invitationId,
      askerDisplayName,
      question,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const answerQuestion = mutation({
  args: {
    adminAccessToken: v.string(),
    questionId: v.id("qaQuestions"),
    answer: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdminAccess(ctx, args.adminAccessToken);
    const answer = normalizeRequired(args.answer, "odpowiedź");
    await ctx.db.patch(args.questionId, {
      answer,
      status: "answered",
      answeredAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      action: "qa.answered",
      actorType: "admin",
      actorId: admin.email,
      entityType: "qaQuestion",
      entityId: args.questionId,
      metadata: { answerLength: answer.length },
    });
    return null;
  },
});
