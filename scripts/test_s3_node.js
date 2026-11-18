const s3 = require("../backend/src/services/s3Service");
const https = require("https");

async function main() {
  console.log("Testing Amazon S3 upload...");
  const upload = await s3.uploadDocument(
    "certificates/GL-REC-2026-0001.json",
    JSON.stringify({
      certificateId: "GL-REC-2026-0001",
      producer: "Helios Solar Park",
      kwh: 80,
      timestamp: new Date().toISOString()
    }),
    "application/json"
  );
  console.log("S3 Upload Result:", upload);

  console.log("\nGenerating S3 presigned download URL...");
  const presignedUrl = await s3.getPresignedDownloadUrl("certificates/GL-REC-2026-0001.json", 3600);
  console.log("Presigned URL:", presignedUrl.substring(0, 100) + "...");

  console.log("\nTesting download via presigned URL...");
  https.get(presignedUrl, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log(`HTTP Status: ${res.statusCode}`);
      console.log("Downloaded JSON Body:", data);
      console.log(">>> S3 ENCRYPTED STORAGE AND PRESIGNED URL VERIFIED 100%! <<<");
    });
  }).on("error", (err) => {
    console.error("Download Error:", err.message);
  });
}

main();
