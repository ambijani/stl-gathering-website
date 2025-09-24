import { Schema, model, models } from "mongoose";

const PersonSchema = new Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  interests: [String],
  availability: String,
}, { timestamps: true });

export default models.Person || model("Person", PersonSchema);
