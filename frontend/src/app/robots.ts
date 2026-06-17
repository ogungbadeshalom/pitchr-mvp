import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchr.com.ng';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/dashboard/', '/session/', '/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
