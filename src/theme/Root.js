import React from 'react';

export default function Root({children}) {

    return (
      <div className={typeof window !== 'undefined' && window.screen.width <= 996 ? "custom-mobile" : ""}>
        {children}
      </div>
    )
}