import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PostLoginTransitionOverlay from '../components/auth/PostLoginTransitionOverlay';
import { router } from '../router';

const PostLoginTransitionContext = createContext(null);

export function PostLoginTransitionProvider({ children }) {
  const [transitionState, setTransitionState] = useState({
    active: false,
    initialRect: null,
    hasLanded: false,
  });

  const startPostLoginTransition = useCallback(({ initialRect, targetUrl = '/dashboard' }) => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTransitionState({ active: false, initialRect: null, hasLanded: true });
      router.navigate(targetUrl, { replace: true });
      return;
    }

    // 1. Immediately activate transition state with measured mascot rect
    setTransitionState({
      active: true,
      initialRect,
      hasLanded: false,
    });

    // 2. Immediately navigate so dashboard is mounted & rendered behind the sliding doors
    router.navigate(targetUrl, { replace: true });
  }, []);

  const handleMascotLanded = useCallback(() => {
    setTransitionState((prev) => ({ ...prev, hasLanded: true }));
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setTransitionState({
      active: false,
      initialRect: null,
      hasLanded: true,
    });
  }, []);

  const value = useMemo(
    () => ({
      isTransitioning: transitionState.active,
      hasLanded: transitionState.hasLanded,
      startPostLoginTransition,
    }),
    [transitionState.active, transitionState.hasLanded, startPostLoginTransition]
  );

  return (
    <PostLoginTransitionContext.Provider value={value}>
      {children}
      {transitionState.active && (
        <PostLoginTransitionOverlay
          initialRect={transitionState.initialRect}
          onMascotLanded={handleMascotLanded}
          onComplete={handleTransitionComplete}
        />
      )}
    </PostLoginTransitionContext.Provider>
  );
}

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

