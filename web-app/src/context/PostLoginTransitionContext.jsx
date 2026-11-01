import { useState, useCallback, useMemo } from 'react';
import PostLoginTransitionOverlay from '../components/auth/PostLoginTransitionOverlay';
import { PostLoginTransitionContext } from './postLoginTransitionContextInstance';
import { router } from '../router';

export function PostLoginTransitionProvider({ children }) {
  const [transitionState, setTransitionState] = useState({
    active: false,
    initialRect: null,
    hasLanded: false,
    email: '',
  });

  const startPostLoginTransition = useCallback(({ initialRect, targetUrl = '/dashboard', email = '' }) => {
    // Respect prefers-reduced-motion: skip animation immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTransitionState({ active: false, initialRect: null, hasLanded: true, email: '' });
      router.navigate(targetUrl, { replace: true });
      return;
    }

    // 1. Immediately activate transition state
    setTransitionState({
      active: true,
      initialRect,
      hasLanded: false,
      email,
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
      email: '',
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
          email={transitionState.email}
          onMascotLanded={handleMascotLanded}
          onComplete={handleTransitionComplete}
        />
      )}
    </PostLoginTransitionContext.Provider>
  );
}
