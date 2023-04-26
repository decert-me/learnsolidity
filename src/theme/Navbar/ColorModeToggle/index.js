import React from 'react';
import {useColorMode, useThemeConfig} from '@docusaurus/theme-common';
import ColorModeToggle from '@theme/ColorModeToggle';
export default function NavbarColorModeToggle({className}) {
  const disabled = useThemeConfig().colorMode.disableSwitch;
  const {colorMode, setColorMode} = useColorMode();
  if (disabled) {
    return null;
  }
  return (
    <ColorModeToggle
      className={className}
      value={colorMode}
      onChange={setColorMode}
    />
  );
}
