import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";

// Allowed image mime types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Create a unique filename with timestamp and random string
function generateUniqueFileName(originalName: string): string {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${timestamp}-${random}.${extension}`;
}

// Validate image file
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "File type not allowed. Only JPEG, PNG, WebP, and GIF are supported.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size is ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    };
  }

  return { valid: true };
}

// Initialize S3Client for R2
export function getR2Client() {
  try {
    // CloudFlare R2 uses AWS SDK S3 client
    return new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: fromEnv(),
    });
  } catch (error) {
    console.error("Error initializing R2 client:", error);
    throw new Error(
      "Failed to initialize storage client. Check your credentials."
    );
  }
}

// Upload file to R2
export async function uploadFileToR2(
  file: File,
  folderPath: string = ""
): Promise<string> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const r2Client = getR2Client();
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("R2 bucket name is not configured");
    }

    // Get the file data as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Generate a unique file name
    const fileName = generateUniqueFileName(file.name);

    // Construct the key for the file (with folder path if provided)
    const key = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    // Return the public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    throw error;
  }
}

// Download image from URL and upload to R2
export async function downloadAndUploadToR2(
  imageUrl: string,
  folderPath: string = ""
): Promise<string> {
  try {
    // Skip re-uploading if the URL is already from our R2 bucket
    if (
      process.env.CLOUDFLARE_R2_PUBLIC_URL &&
      imageUrl.startsWith(process.env.CLOUDFLARE_R2_PUBLIC_URL)
    ) {
      return imageUrl; // Already in our R2 storage
    }

    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
    }

    // Get the file type from response headers or use a default
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Validate content type
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new Error(`Image type not allowed: ${contentType}`);
    }

    // Extract the filename from the URL or generate one
    let fileName = imageUrl.split("/").pop();
    if (!fileName || fileName.indexOf("?") !== -1) {
      fileName = `image-${new Date().getTime()}.${contentType.split("/")[1]}`;
    }

    // Convert to blob
    const blob = await response.blob();

    // Validate file size
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error(
        `Image size exceeds limit. Maximum size is ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB.`
      );
    }

    // Convert Blob to File
    const file = new File([blob], fileName, { type: contentType });

    // Upload to R2 using our existing function
    return await uploadFileToR2(file, folderPath);
  } catch (error) {
    console.error("Error downloading and uploading image:", error);
    throw error;
  }
}

// Delete file from R2
export async function deleteFileFromR2(fileUrl: string): Promise<boolean> {
  try {
    // Return early if not an R2 URL
    if (
      !process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      !fileUrl.startsWith(process.env.CLOUDFLARE_R2_PUBLIC_URL)
    ) {
      return false;
    }

    const r2Client = getR2Client();
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("R2 bucket name is not configured");
    }

    // Extract key from URL
    const key = fileUrl.replace(process.env.CLOUDFLARE_R2_PUBLIC_URL + "/", "");

    // Delete from R2
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    return true;
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    return false;
  }
}
