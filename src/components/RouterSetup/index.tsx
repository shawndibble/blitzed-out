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
import { AuthContext } from '../../context/auth';
import { MessagesProvider } from '../../context/messages';
import AppSkeleton from '../AppSkeleton';
import { UserListProvider } from '../../context/userList';
import lazyWithRetry from '@/utils/lazyWithRetry';

const UnauthenticatedApp = lazyWithRetry(() => import('@/views/UnauthenticatedApp'));
const Cast = lazyWithRetry(() => import('@/views/Cast'));
const Room = lazyWithRetry(() => import('@/views/Room'));

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

  // Show skeleton during initial auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  const room = auth.user ? <Room /> : <UnauthenticatedApp />;

  return (
    <Suspense fallback={<AppSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/PUBLIC" />} />
        <Route
          path="/:id/cast"
          element={
            <UppercaseRedirect>
              <UserListProvider>
                <MessagesProvider>
                  <Cast />
                </MessagesProvider>
              </UserListProvider>
            </UppercaseRedirect>
          }
        />
        <Route
          path="/:id"
          element={
            <UppercaseRedirect>
              <UserListProvider>
                <MessagesProvider>{room}</MessagesProvider>
              </UserListProvider>
            </UppercaseRedirect>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function RouterSetup() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
