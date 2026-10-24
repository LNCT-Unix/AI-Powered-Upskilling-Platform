import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full text-center py-12">
        <CircleHelp size={40} className="mx-auto text-green-700" />
        <h1 className="mt-4 text-2xl font-extrabold text-green-950">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The requested page could not be found. Please navigate back to your learning space.
        </p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button>Back to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}
