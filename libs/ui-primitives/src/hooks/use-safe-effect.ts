import { useEffect, useLayoutEffect } from 'react';

export const useSafeEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
