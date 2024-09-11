import { useEffect, useState } from 'react';

export default function useHasMouse() {
  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    const mouseMediaQuery = window.matchMedia('(pointer: fine)');
    setHasMouse(mouseMediaQuery.matches);

    const handleChange = (event) => {
      setHasMouse(event.matches);
    };

    mouseMediaQuery.addEventListener('change', handleChange);
    return () => {
      mouseMediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return hasMouse;
}
