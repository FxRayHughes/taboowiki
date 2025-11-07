import React from 'react';
import Layout from '@theme/Layout';
import ConsoleDashboard from '@site/src/components/ConsoleDashboard';

export default function Console() {
  return (
    <Layout
      title="管理控制台"
      description="TabooWiki 管理员控制台"
      noFooter={false}
    >
      <ConsoleDashboard />
    </Layout>
  );
}
