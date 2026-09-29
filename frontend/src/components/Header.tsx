import type { User } from '../types/User';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-bottom bg-body px-4 py-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-0">BrainSync</h1>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <div className="fw-semibold">
              {user.display_name}
            </div>
            <div className="small text-body-secondary">
              @{user.username}
            </div>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
