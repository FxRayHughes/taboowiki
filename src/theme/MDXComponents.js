import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
// Import custom components
import CImage from '@site/src/components/CImage';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Map the "<CImage>" tag to our CImage component
  // `CImage` will receive all props that were passed to `<CImage>` in MDX
  CImage,
};
