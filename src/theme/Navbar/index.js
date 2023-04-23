import React, { useEffect, useState } from 'react';
import Navbar from '@theme-original/Navbar';
import CustomNav from '../../components/CustomNav';

export default function NavbarWrapper(props) {

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      console.log(screenWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <CustomNav />
      <Navbar {...props} />
    </>
  );
}
