import { useNavigate, useParams } from 'react-router-dom';

export default function useRoomNavigate() {
  const { id: room } = useParams();
  const navigate = useNavigate();

  const changeRooms = (formRoom) => {
    if (room.toUpperCase() !== formRoom?.toUpperCase()) {
      navigate(`/${formRoom || 'PUBLIC'}`);
    }
  };

  return changeRooms;
}
