import os
import re

def refactor_marketplace():
    path = 'frontend/app/marketplace/[id]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already refactored
    if 'generateStaticParams' in content:
        print('Marketplace already refactored')
        return

    # Create Client component
    client_content = content
    client_content = re.sub(
        r'import \{ useRouter \} from "next/navigation";',
        'import { useRouter, useParams } from "next/navigation";',
        client_content
    )
    client_content = re.sub(
        r'export default function MarketplaceListingDetailsPage\([^)]*\)\s*\{[^}]*const resolvedParams = use\(params\);\s*const listingId = resolvedParams\.id;',
        'export default function MarketplaceListingDetailsClient() {\n  const rawParams = useParams();\n  const listingId = (rawParams?.id as string) || "1";',
        client_content,
        flags=re.DOTALL
    )
    with open('frontend/app/marketplace/[id]/MarketplaceListingDetailsClient.tsx', 'w', encoding='utf-8') as f:
        f.write(client_content)

    server_page = '''import MarketplaceListingDetailsClient from "./MarketplaceListingDetailsClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
}

export default function MarketplaceListingDetailsPage() {
  return <MarketplaceListingDetailsClient />;
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(server_page)
    print('Refactored marketplace/[id]')

def refactor_consumer_requests():
    path = 'frontend/app/consumer/requests/[id]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'generateStaticParams' in content:
        print('Consumer requests already refactored')
        return

    client_content = content
    client_content = re.sub(
        r'import \{ useRouter \} from "next/navigation";',
        'import { useRouter, useParams } from "next/navigation";',
        client_content
    )
    client_content = re.sub(
        r'export default function ConsumerRequestDetailsPage\([^)]*\)\s*\{[^}]*const resolvedParams = use\(params\);\s*const requestId = resolvedParams\.id;',
        'export default function ConsumerRequestDetailsClient() {\n  const rawParams = useParams();\n  const requestId = (rawParams?.id as string) || "1";',
        client_content,
        flags=re.DOTALL
    )
    with open('frontend/app/consumer/requests/[id]/ConsumerRequestDetailsClient.tsx', 'w', encoding='utf-8') as f:
        f.write(client_content)

    server_page = '''import ConsumerRequestDetailsClient from "./ConsumerRequestDetailsClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function ConsumerRequestDetailsPage() {
  return <ConsumerRequestDetailsClient />;
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(server_page)
    print('Refactored consumer/requests/[id]')

def refactor_producer_listings():
    path = 'frontend/app/producer/listings/[id]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'generateStaticParams' in content:
        print('Producer listings already refactored')
        return

    client_content = content
    client_content = re.sub(
        r'import \{ useRouter \} from "next/navigation";',
        'import { useRouter, useParams } from "next/navigation";',
        client_content
    )
    client_content = re.sub(
        r'export default function ProducerListingDetailsPage\([^)]*\)\s*\{[^}]*const resolvedParams = use\(params\);\s*const listingId = resolvedParams\.id;',
        'export default function ProducerListingDetailsClient() {\n  const rawParams = useParams();\n  const listingId = (rawParams?.id as string) || "1";',
        client_content,
        flags=re.DOTALL
    )
    with open('frontend/app/producer/listings/[id]/ProducerListingDetailsClient.tsx', 'w', encoding='utf-8') as f:
        f.write(client_content)

    server_page = '''import ProducerListingDetailsClient from "./ProducerListingDetailsClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function ProducerListingDetailsPage() {
  return <ProducerListingDetailsClient />;
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(server_page)
    print('Refactored producer/listings/[id]')

def refactor_verify_certificate():
    path = 'frontend/app/verify-certificate/[certificateId]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'generateStaticParams' in content:
        print('Verify certificate already refactored')
        return

    client_content = content
    with open('frontend/app/verify-certificate/[certificateId]/VerifyCertificateClient.tsx', 'w', encoding='utf-8') as f:
        f.write(client_content)

    server_page = '''import VerifyCertificateClient from "./VerifyCertificateClient";

export function generateStaticParams() {
  return [{ certificateId: "1" }];
}

export default function VerifyCertificatePage() {
  return <VerifyCertificateClient />;
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(server_page)
    print('Refactored verify-certificate/[certificateId]')

def refactor_verify_alias():
    path = 'frontend/app/verify/[id]/page.tsx'
    server_page = '''import VerifyCertificateClient from "../verify-certificate/[certificateId]/VerifyCertificateClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function VerifyAliasPage() {
  return <VerifyCertificateClient />;
}
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(server_page)
    print('Refactored verify/[id]')

if __name__ == '__main__':
    refactor_marketplace()
    refactor_consumer_requests()
    refactor_producer_listings()
    refactor_verify_certificate()
    refactor_verify_alias()
