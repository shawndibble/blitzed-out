import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Suspense, useContext, useEffect } from 'react';
import { WindowWithAuth } from '../../types/app';
import { AuthContext } from '../../context/auth';
import { MessagesProvider } from '../../context/messages';
import AppSkeleton from '../AppSkeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

// Lazy load UserListProvider with retry logic
const UserListProvider = lazyWithRetry(() =>
  import('../../context/userList').then((m) => ({ default: m.UserListProvider }))
);

// Lazy load main views with retry logic
const UnauthenticatedApp = lazyWithRetry(() => import('../../views/UnauthenticatedApp'));
const Cast = lazyWithRetry(() => import('../../views/Cast'));
const Room = lazyWithRetry(() => import('../../views/Room'));

// Component to ensure the room ID is always uppercase
function UppercaseRedirect({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (id && id !== id.toUpperCase()) {
      const newPath = location.pathname.replace(id, id.toUpperCase());
      navigate(newPath + location.search + location.hash, { replace: true });
    }
  }, [id, navigate, location]);

  return <>{children}</>;
}

function AppRoutes() {
  const auth = useContext(AuthContext);

  // Make auth context available to the middleware
  useEffect(() => {
    if (auth) {
      (window as unknown as WindowWithAuth).authContext = auth;
    }
    return () => {
      (window as unknown as WindowWithAuth).authContext = null;
    };
  }, [auth]);

  // Show skeleton during initial auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  const room = auth.user ? <Room /> : <UnauthenticatedApp />;

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/PUBLIC" />} />
      <Route
        path="/:id/cast"
        element={
          <UppercaseRedirect>
            <Suspense fallback={<AppSkeleton />}>
              <UserListProvider>
                <MessagesProvider>
                  <Cast />
                </MessagesProvider>
              </UserListProvider>
            </Suspense>
          </UppercaseRedirect>
        }
      />
      <Route
        path="/:id"
        element={
          <UppercaseRedirect>
            <Suspense fallback={<AppSkeleton />}>
              <UserListProvider>
                <MessagesProvider>{room}</MessagesProvider>
              </UserListProvider>
            </Suspense>
          </UppercaseRedirect>
        }
      />
    </Routes>
  );
}

export default function RouterSetup() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
