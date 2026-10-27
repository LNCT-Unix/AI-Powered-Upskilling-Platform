import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <Card className="max-w-md w-full text-center py-10 px-6 sm:px-8 space-y-5">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 text-slate-700">
            <Compass size={24} className="text-slate-500" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Page Not Found</h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            The curriculum or learning resource you requested cannot be located.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link to="/dashboard">
            <Button variant="primary">
              <ArrowLeft size={15} /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
