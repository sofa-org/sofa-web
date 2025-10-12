export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
}

export const pageSEOConfig: Record<string, PageSEO> = {
  '/': {
    title: 'SOFA.org',
    description: 'SOFA.org is a decentralized, nonprofit, open-source technology organization offering protocols for crypto products, especially options. Earn $RCH via protocol use, liquidity provision, and governance. $SOFA enables holders to vote on proposals that shape SOFA.org\'s future.',
    keywords: 'DeFi, RCH, SOFA, decentralized finance, crypto structured products, blockchain, protocol safety, community rewards, financial technology, governance token, decentralized organization, DeFi education, capital efficiency, nonprofit finance'
  },
  '/policy': {
    title: 'Policy - SOFA.org',
    description: ''
  },
  '/mechanism': {
    title: 'Project - SOFA.org',
    description: '100% on-chain and tokenized positions.'
  },
  '/strengths': {
    title: 'Capabilities - SOFA.org',
    description: 'The SOFA protocol is our ambitious attempt to establish standards of how financial assets can be atomically settled on-chain, while simultaneously catalyzing DeFi capital liquidity through transferrable Position Tokens.'
  },
  '/rch': {
    title: 'RCH - SOFA.org',
    description: 'Earn $RCH via protocol use, liquidity provision, and governance.'
  },
  '/points': {
    title: 'Points - SOFA.org',
    description: 'Discover the rules for earning $SOFA points on the SOFA protocol. See how interacting with our DeFi products and options qualifies you for $SOFA airdrop.'
  },
  '/positions': {
    title: 'Positions - SOFA.org',
    description: ''
  },
  '/products': {
    title: 'Products - SOFA.org',
    description: 'Trade options products like Earn, Surge, and Dual, and follow Automator strategies on our protocol to get $RCH airdrops.'
  },
  '/products/customize': {
    title: 'Customize - SOFA.org',
    description: 'Customize DeFi options products tailored to your investment strategy and risk preferences on SOFA platform and get exclusive $RCH airdrops.'
  },
  '/products/automator': {
    title: 'Automator - SOFA.org',
    description: 'Automator is a DeFi product to follow top strategies or create your own to earn profits and receive exclusive $RCH airdrops.'
  },
  '/products/automator/mine': {
    title: 'My Automators - SOFA.org',
    description: ''
  },
  '/products/automator/operate': {
    title: 'Operate Automator - SOFA.org',
    description: ''
  },
  '/products/automator/create': {
    title: 'Create Automator - SOFA.org',
    description: 'Create your own automator and roll it to earn profits.'
  },
  '/positions/orders': {
    title: 'Order History - SOFA.org',
    description: ''
  },
  '/automator/positions': {
    title: 'Automator Positions - SOFA.org',
    description: ''
  },
  '/transactions': {
    title: 'Transactions History - SOFA.org',
    description: ''
  },
  '/a': {
    title: 'Automator Sharing - SOFA.org',
    description: 'Follow Automator strategies on our protocol to earn profits and get exclusive $RCH airdrops.'
  },
  'Earn': {
    title: 'Earn - SOFA.org',
    description: 'Earn is a low-risk DeFi options product that offers stable returns and exclusive $RCH airdrops.'
  },
  'Surge': {
    title: 'Surge - SOFA.org',
    description: 'Surge: a high-risk DeFi options product that delivers high returns and rewards traders with exclusive $RCH airdrops.'
  },
  'Dual': {
    title: 'Dual - SOFA.org',
    description: 'Discover Dual, an innovative DeFi options product that lets you sell high, buy low, and receive $RCH airdrops for extra trading rewards.'
  }
};

/**
 * Get SEO information for a given URL path (with or without query parameters)
 * @param pathWithQuery - The URL path, may include query parameters (e.g., '/products?project=Earn')
 * @returns PageSEO object with title, description, and keywords
 */
export const getPageSEO = (pathWithQuery: string): PageSEO => {
  // Split path and query parameters
  const [pathname, queryString] = pathWithQuery.split('?');

  // Parse query parameters
  const params = new URLSearchParams(queryString || '');
  const project = params.get('project');

  // Handle special cases based on path and query parameters
  if (pathname === '/products' && project === 'Automator') {
    return pageSEOConfig['/products/automator'];
  }

  if (pathname === '/products/customize' && project) {
    // Map project parameter to corresponding SEO config
    const projectKey = project; // 'Earn', 'Surge', 'Dual'
    if (pageSEOConfig[projectKey]) {
      return pageSEOConfig[projectKey];
    }
  }

  // Return static SEO based on pathname (without query parameters)
  return pageSEOConfig[pathname] || { title: 'SOFA.org', description: '' };
};