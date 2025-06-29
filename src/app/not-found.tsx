import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
            <FileX className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">404 - Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          <Button asChild>
            <Link href="/">Go Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
