export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function GET() {
  try {
    console.log('People API - Starting GET request...');
    
    console.log('People API - Checking admin authentication...');
    await requireAdmin();
    console.log('People API - Admin authentication successful');
    
    console.log('People API - Connecting to MongoDB...');
    await connect();
    console.log('People API - MongoDB connection successful');
    
    console.log('People API - Querying Person collection...');
    
    // First, let's check what collections exist in this database
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
    
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('People API - Available collections:', collections.map(c => c.name));
      
      // Check if Person collection exists
      const personCollectionExists = collections.some(c => c.name === 'people');
      console.log('People API - Person collection exists:', personCollectionExists);
      
      // Try to get the collection count
      try {
        const collection = db.collection('people');
        const count = await collection.countDocuments();
        console.log('People API - Person collection document count:', count);
      } catch (e) {
        console.log('People API - Could not get collection count:', (e as Error).message);
      }
    } else {
      console.log('People API - Database connection not available');
    }
    
    const rows = await Person.find().sort({ createdAt: -1 }).lean();
    console.log(`People API - Found ${rows.length} people in database`);
    
    // Log some details about the people found (without sensitive info)
    if (rows.length > 0) {
      console.log('People API - Sample people data:', rows.slice(0, 3).map(p => ({
        id: p._id,
        name: p.name,
        hasEmail: !!p.email,
        hasPhone: !!p.phone,
        interestsCount: p.interests?.length || 0,
        createdAt: p.createdAt
      })));
    }
    
    console.log('People API - Returning people data');
    return Response.json(rows);
  } catch (error) {
    console.error('People API - Error:', error);
    return Response.json(
      { error: 'Failed to fetch people data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}