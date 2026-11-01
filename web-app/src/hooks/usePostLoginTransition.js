import { useContext } from 'react';
import { PostLoginTransitionContext } from '../context/postLoginTransitionContextInstance';

export function usePostLoginTransition() {
  const context = useContext(PostLoginTransitionContext);
  if (!context) {
    return {
      isTransitioning: false,
      hasLanded: true,
      startPostLoginTransition: () => {},
    };
  }
  return context;
}
