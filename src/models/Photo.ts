import { Schema, model, models } from "mongoose";

const PhotoSchema = new Schema(
  {
    gatheringId: { type: Schema.Types.ObjectId, ref: "Gathering", required: true, index: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Photo || model("Photo", PhotoSchema);
