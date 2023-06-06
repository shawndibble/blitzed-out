import CircleIcon from '@mui/icons-material/Circle';

export default function PlayersOnline({ playerList, innerRef, ...props }) {
  return (
    <div {...props} ref={innerRef}>
      <CircleIcon color="success" sx={{ fontSize: 8, marginRight: '0.2rem' }} />
      {playerList.length}
    </div>
  );
};