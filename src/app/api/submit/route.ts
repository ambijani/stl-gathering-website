export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  interests: z.array(z.string()).max(50).optional(),
  availability: z.string().max(1000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    console.log('Submit API - Starting person creation...');
    
    await connect();
    console.log('Submit API - MongoDB connection established');
    
    const json = await req.json().catch(() => null);
    if (!json) {
      console.log('Submit API - Invalid JSON received');
      return new Response("Bad JSON", { status: 400 });
    }
    
    console.log('Submit API - Received data:', {
      hasName: !!json.name,
      hasEmail: !!json.email,
      hasPhone: !!json.phone,
      interestsCount: json.interests?.length || 0,
      hasAvailability: !!json.availability
    });

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      console.log('Submit API - Validation failed:', parsed.error.issues);
      return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    
    console.log('Submit API - Validation successful, creating person...');
    const doc = await Person.create(parsed.data);
    console.log('Submit API - Person created successfully with ID:', doc._id);
    console.log('Submit API - Person name:', doc.name);
    
    return Response.json({ ok: true, id: doc._id });
  } catch (error) {
    console.error('Submit API - Error creating person:', error);
    return Response.json(
      { error: 'Failed to create person', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
