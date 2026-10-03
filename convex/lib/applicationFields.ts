import { v } from "convex/values";

export const applicationFields = {
  companyName: v.string(),
  jobTitle: v.string(),
  status: v.union(
    v.literal("saved"),
    v.literal("applied"),
    v.literal("screening"),
    v.literal("interviewing"),
    v.literal("offer"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("withdrawn"),
  ),
  jobUrl: v.string(),
  location: v.string(),
  appliedDate: v.string(),
  followUpDate: v.string(),
  contactName: v.string(),
  contactEmail: v.string(),
  notes: v.string(),
};
