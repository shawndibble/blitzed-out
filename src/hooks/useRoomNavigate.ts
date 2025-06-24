import { Params, useNavigate, useParams } from 'react-router-dom';

export default function useRoomNavigate(): (formRoom?: string) => void {
  const { id: room } = useParams<Params>();
  const navigate = useNavigate();

  return (formRoom?: string): void => {
    if (room !== undefined && room?.toUpperCase() !== formRoom?.toUpperCase()) {
      const noLeadingSlash = formRoom?.replace(/^\/+/, '') || 'PUBLIC';
      navigate(`/${noLeadingSlash}`);
    }
  };
}
