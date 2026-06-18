export default function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pitchr',
    url: 'https://pitchr.com.ng',
    description: 'AI proposal generator for Nigerian freelancers. Write winning Upwork and Fiverr proposals in 30 seconds.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Flash Session',
        price: '500',
        priceCurrency: 'NGN',
        description: '5 AI proposals, one-time',
      },
      {
        '@type': 'Offer',
        name: 'Power Session',
        price: '1200',
        priceCurrency: 'NGN',
        description: '20 AI proposals, one-time, 4-hour window',
      },
      {
        '@type': 'Offer',
        name: 'Starter Monthly',
        price: '1500',
        priceCurrency: 'NGN',
        description: '30 proposals/month',
      },
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '3500',
        priceCurrency: 'NGN',
        description: 'Unlimited proposals',
      },
    ],
    provider: {
      '@type': 'Organization',
      name: 'Pitchr',
      url: 'https://pitchr.com.ng',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
