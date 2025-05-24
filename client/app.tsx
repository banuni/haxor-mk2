import { Link, Outlet } from '@tanstack/react-router'

export const App = () => {
  return (
    <div className="min-h-screen bg-black text-green-500">
      <div className="max-w-md mx-auto p-4">
        <nav className="mb-4">
          <ul className="flex space-x-4">
            <li>
              <Link to="/master" className="hover:text-green-400">Master</Link>
            </li>
            <li>
              <Link to="/player" className="hover:text-green-400">Player</Link>
            </li>
          </ul>
        </nav>
        <Outlet />
      </div>
    </div>
  );
};
