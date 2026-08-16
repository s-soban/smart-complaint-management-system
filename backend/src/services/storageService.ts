import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'complaint-images';

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    console.log('☁️ Supabase Storage client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else {
  console.log('ℹ️ Supabase Storage credentials not configured. File uploads will use local fallback.');
}

export function isSupabaseStorageConfigured(): boolean {
  return supabaseClient !== null;
}

/**
 * Upload a file from Multer temporary disk storage to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadToSupabaseStorage(
  file: Express.Multer.File,
  folder: 'complaints' | 'repairs',
  complaintId: string
): Promise<string> {
  // If Supabase Storage is available, upload directly to Supabase
  if (supabaseClient) {
    try {
      const fileExt = path.extname(file.originalname) || '.jpg';
      const cleanFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const storagePath = `${folder}/${complaintId}/${cleanFileName}`;

      const fileBuffer = fs.readFileSync(file.path);

      // Attempt upload to bucket
      let { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype || 'image/jpeg',
          upsert: true
        });

      // If bucket does not exist, attempt to auto-create it as public
      if (error && (error.message.includes('not found') || error.message.includes('Bucket'))) {
        console.log(`📦 Creating Supabase storage bucket '${BUCKET_NAME}'...`);
        await supabaseClient.storage.createBucket(BUCKET_NAME, { public: true });
        
        // Retry upload
        const retry = await supabaseClient.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: true
          });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error(`❌ Supabase Storage upload error for ${file.originalname}:`, error);
        throw error;
      }

      // Obtain public URL for the file
      const { data: publicUrlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      // Remove temporary file from local filesystem
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      console.log(`✅ File uploaded to Supabase Storage: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error('Supabase upload exception:', err.message || err);
      // Fallback to local storage URL if cloud upload fails
    }
  }

  // Fallback if Supabase client not present or upload failed
  if (file.path && fs.existsSync(file.path)) {
    try {
      const buffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || 'image/jpeg';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (e) {
      console.error('Base64 encoding fallback error:', e);
    }
  }

  return `/uploads/${folder}/${file.filename}`;
}
