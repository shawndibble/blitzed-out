import { useEffect, useState } from 'react';

export default function useHasMouse(): boolean {
  const [hasMouse, setHasMouse] = useState<boolean>(false);

  useEffect(() => {
    const mouseMediaQuery = window.matchMedia('(pointer: fine)');
    setHasMouse(mouseMediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setHasMouse(event.matches);
    };

    mouseMediaQuery.addEventListener('change', handleChange);
    return () => {
      mouseMediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return hasMouse;
}
