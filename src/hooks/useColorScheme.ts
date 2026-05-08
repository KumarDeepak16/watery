// reactive system color scheme

import { useEffect, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

export type SystemScheme = 'light' | 'dark';

export const useColorScheme = (): SystemScheme => {
  const [scheme, setScheme] = useState<SystemScheme>(() => {
    const sys: ColorSchemeName = Appearance.getColorScheme();
    return sys === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  return scheme;
};
