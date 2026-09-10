import { Link } from 'react-router-dom';

export function TopNavBar() {
  return (
    <nav className="bg-surface-container-lowest text-primary w-full sticky top-0 z-50 border-b border-outline-variant shadow-sm shrink-0">
      <div className="flex justify-between items-center px-container-padding py-base w-full max-w-[1200px] mx-auto">
        <div className="text-headline-md font-headline-md font-bold text-primary">Velocity Core</div>
        <ul className="flex items-center gap-6">
          <li><Link className="text-secondary border-b-2 border-secondary pb-1 font-bold text-label-caps" to="/parking">Find Parking</Link></li>
          <li><a className="text-on-surface-variant font-medium text-label-caps" href="#">My Bookings</a></li>
        </ul>
      </div>
    </nav>
  );
}