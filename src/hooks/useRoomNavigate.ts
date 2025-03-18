import { Params, useNavigate, useParams } from 'react-router-dom';

export default function useRoomNavigate(): (formRoom?: string) => void {
  const { id: room } = useParams<Params>();
  const navigate = useNavigate();

  const changeRooms = (formRoom?: string): void => {
    if (room?.toUpperCase() !== formRoom?.toUpperCase()) {
      navigate(`/${formRoom || 'PUBLIC'}`);
    }
  };

  return changeRooms;
}
