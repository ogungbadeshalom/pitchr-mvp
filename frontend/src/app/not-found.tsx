import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-teal-50">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-brand-600 mb-2">404</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
