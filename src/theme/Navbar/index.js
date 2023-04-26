import React from 'react';
import Navbar from '@theme-original/Navbar';
import CustomNav from '../../components/CustomNav';

export default function NavbarWrapper(props) {

  return (
    <>
      <CustomNav />
      <Navbar {...props} />
    </>
  );
}
