import LandingContent from './components/LandingContent.js';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Wackelturm AR · Start',
  description: 'QR-Landingpage für die AR-Ansicht am Wackelturm in Leipzig.',
};

async function buildArUrlFromHeaders() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost || requestHeaders.get('host') || 'localhost:3000';
  const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https');

  return `${protocol}://${host}/ar`;
}

export default async function HomePage() {
  const arUrl = await buildArUrlFromHeaders();
  return <LandingContent arUrl={arUrl} />;
}

