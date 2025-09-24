import { Schema, model, models } from "mongoose";

const VaroSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    location: String,
    startTime: Date,
    endTime: Date,
    capacity: Number,
    tags: [String],
    assignedPeople: [{ type: Schema.Types.ObjectId, ref: "Person" }]
  },
  { _id: true }
);

const ShoeCountItemSchema = new Schema(
  { size: String, qty: Number },
  { _id: false }
);

const GatheringSchema = new Schema(
  {
    title: String,
    date: { type: Date, required: true, index: true },
    notes: String,
    varos: [VaroSchema],
    shoeCount: [ShoeCountItemSchema]
  },
  { timestamps: true }
);

export default models.Gathering || model("Gathering", GatheringSchema);
