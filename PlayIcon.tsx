import React from 'react';

export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      {...props} // يسمح بتمرير className مثل w-6 h-6
    >
      <path 
        fillRule="evenodd" 
        d="M4.5 5.653c0-1.426 1.529-2.38 2.724-1.638l11.925 6.453c1.171.632 1.171 2.312 0 2.944l-11.925 6.453c-1.195.647-2.724-.218-2.724-1.638V5.653z" 
        clipRule="evenodd" 
      />
    </svg>
  );
};