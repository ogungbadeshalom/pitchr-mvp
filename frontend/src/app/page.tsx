import type { Metadata } from 'next';
import LandingPage from '../components/landing-page';

export const metadata: Metadata = {
  title: 'Tailored AI Proposal Generator for Freelancers',
  description: 'Write winning Upwork and Fiverr proposals in 30 seconds. AI-powered, no templates, no clichés. Pay as you go from ₦500. Built for Nigerian freelancers.',
  openGraph: {
    title: 'Pitchr — Tailored AI Proposal Generator for Freelancers',
    description: 'Write winning Upwork and Fiverr proposals in 30 seconds. AI-powered, no templates, no clichés. Pay as you go from ₦500.',
    type: 'website',
    images: [
      {
        url: '/images/P.png',
        width: 512,
        height: 512,
        alt: 'Pitchr',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pitchr — Tailored AI Proposal Generator for Freelancers',
    description: 'Write winning Upwork and Fiverr proposals in 30 seconds. Pay as you go from ₦500.',
    images: ['/images/P.png'],
  },
};

export default function Home() {
  return <LandingPage />;
}
