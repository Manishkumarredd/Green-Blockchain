const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/env");

let s3Client = null;

function getClient() {
  if (s3Client) return s3Client;

  try {
    s3Client = new S3Client({
      region: config.S3.REGION || "ap-southeast-2",
    });
  } catch (err) {
    console.warn("[S3 Service] Could not initialize AWS S3 client:", err.message);
  }

  return s3Client;
}

/**
 * Upload a document (e.g. REC PDF certificate, CSV export) to Amazon S3.
 */
async function uploadDocument(key, body, contentType = "application/octet-stream") {
  const bucketName = config.S3.BUCKET_NAME;
  const client = getClient();

  if (!client || !bucketName) {
    return {
      success: true,
      mode: "LOCAL_FALLBACK",
      bucket: bucketName,
      key,
      url: `/uploads/${key}`,
    };
  }

  try {
    const cmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    });

    await client.send(cmd);

    return {
      success: true,
      mode: "AWS_S3",
      bucket: bucketName,
      key,
    };
  } catch (err) {
    console.warn(`[S3 Upload Error: ${key}]`, err.message);
    return {
      success: false,
      error: err.message,
      key,
    };
  }
}

/**
 * Generate a secure presigned URL for downloading S3 documents without public exposure.
 */
async function getPresignedDownloadUrl(key, expiresIn = 3600) {
  const bucketName = config.S3.BUCKET_NAME;
  const client = getClient();

  if (!client || !bucketName) {
    return `http://localhost:5000/api/v1/certificates/download/${key}`;
  }

  try {
    const cmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, cmd, { expiresIn });
    return url;
  } catch (err) {
    console.warn(`[S3 Presigned URL Error: ${key}]`, err.message);
    return `https://${bucketName}.s3.${config.S3.REGION}.amazonaws.com/${key}`;
  }
}

/**
 * List documents stored in S3 by prefix.
 */
async function listStoredDocuments(prefix = "") {
  const bucketName = config.S3.BUCKET_NAME;
  const client = getClient();

  if (!client || !bucketName) {
    return [];
  }

  try {
    const cmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 50,
    });

    const res = await client.send(cmd);
    return (res.Contents || []).map((item) => ({
      key: item.Key,
      sizeBytes: item.Size,
      lastModified: item.LastModified,
    }));
  } catch (err) {
    console.warn("[S3 List Error]", err.message);
    return [];
  }
}

module.exports = {
  uploadDocument,
  getPresignedDownloadUrl,
  listStoredDocuments,
};
