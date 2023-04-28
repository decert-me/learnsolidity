import React from 'react';
import Footer from '@theme-original/Footer';
import AppFooter from '../../components/CustomFooter';

export default function FooterWrapper(props) {
  return (
    <>
      {/* <Footer {...props} /> */}
      <footer>
        <AppFooter />
      </footer>
    </>
  );
}
