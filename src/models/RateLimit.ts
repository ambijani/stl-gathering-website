import { Schema, model, models } from "mongoose";

// One document per (limiter, client IP, time window). Mongo deletes a document once its expiresAt has passed.
const RateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { versionKey: false }
);

export default models.RateLimit || model("RateLimit", RateLimitSchema);
