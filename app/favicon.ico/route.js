export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Wackelturm AR favicon">
  <rect width="64" height="64" rx="14" fill="#2563eb"/>
  <path d="M18 47h28l-4-20-10-8-10 8-4 20Z" fill="#ffffff"/>
  <path d="M28 19h8v28h-8z" fill="#0f172a" opacity="0.2"/>
  <circle cx="32" cy="26" r="3" fill="#0f172a"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

