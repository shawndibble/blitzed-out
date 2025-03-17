import { useNavigate, useParams } from 'react-router-dom';

interface RouteParams {
  id: string;
}

export default function useRoomNavigate(): (formRoom?: string) => void {
  const { id: room } = useParams<RouteParams>();
  const navigate = useNavigate();

  const changeRooms = (formRoom?: string): void => {
    if (room?.toUpperCase() !== formRoom?.toUpperCase()) {
      navigate(`/${formRoom || 'PUBLIC'}`);
    }
  };

  return changeRooms;
}
