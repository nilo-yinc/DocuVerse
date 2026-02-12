import { useEffect } from 'react';

const useTitle = (title) => {
  useEffect(() => {
    if (!title) return;
    const prevTitle = document.title;
    document.title = `${title} | DocuVerse`;
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default useTitle;
