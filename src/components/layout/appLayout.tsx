import { Outlet } from 'react-router-dom';
import { TopNavBar } from './topNavBar.js';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col">
      <TopNavBar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}