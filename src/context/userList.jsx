import { createContext, useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserList } from 'services/firebase';

const UserListContext = createContext();

function UserListProvider(props) {
  const { id: room } = useParams();
  const [onlineUsers, setOnlineUsers] = useState(null);

  useEffect(() => {
    getUserList(room, (newUsers) => setOnlineUsers(newUsers), onlineUsers);
  }, [room]);

  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListContext, UserListProvider };
