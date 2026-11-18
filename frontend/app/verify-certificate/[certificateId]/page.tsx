import VerifyCertificateClient from "./VerifyCertificateClient";

export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ certificateId: String(i + 1) }));
}

export default function VerifyCertificatePage() {
  return <VerifyCertificateClient />;
}
