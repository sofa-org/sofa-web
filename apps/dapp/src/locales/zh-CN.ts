import semiLocale from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';

export default {
  Earn: 'Earn',
  'Capital Secured Earnings': '安全收益',
  Secured: '安全的',
  'By smartly combining the safety of savings income with a sprinkle of embedded options, your principal is securely generating yield in trusted DeFi protocols such as Aave/Lido/Sofa/Curve, while a portion of that income will be funding upside option structures for a chance at extra gains.  Perfect for the risk conscious user who wants to benefit from upside gains with minimal downside.':
    'SOFA巧妙地融合了安全储蓄和嵌入式期权，用户的本金会在 Aave/Lido/Sofa/Curve 等可信赖的DeFi协议中安全生息，同时部分利息收入将用于购买期权，为用户带来额外的收益机会。这非常适合注重风险控制，同时希望获取潜在高收益的投资者。',
  Leverage: '杠杆',
  Surge: 'Surge',
  'ApxWinnings Tickets': '近似中奖券',
  'All-or-None': '全有或全无',
  'Popular TradFi exotics investments can now be safely invested on-chain, allowing users to speculate on token price action through a diverse product suite including Rangebound, Trends, and Shark Fin products.  Higher returns will come at the risk of principal losses, though users will have full control over the product parameters under our flexible RFQ interface.':
    '现在，用户也可以在区块链上安全地购买传统金融领域热门的另类投资产品了。您可以通过多样化的产品组合来追踪资产价格波动并获利。包括区间限定(Ragnebound)、趋势(Trends)和鲨鱼鳍等产品，这些Surge产品可能带来更高回报，但同时也存在本金损失的风险，不过请放心，在SOFA便捷的询价界面上，您可以完全掌控产品参数，根据自己的投资策略进行调整。',
  Rangebound: '区间限定',
  'Win if price always in Range before expiry.':
    '到期前，如果资产价格一直在区间范围内则胜出。',
  "Rangebound products are suitable for boring, sideways markets!  Users will get a higher chance of earning upside payoffs when volatility is low and prices aren't moving much!":
    '区间限定产品适合枯燥的横盘市场！当波动性低且价格变动不大时，用户将有更高的机会获得超额收益！',
  'Price Source: <span class="txt-gradient">COINBASE - BTC/USDT spot prices</span>. \n\nAt settlement, the vault will automatically check the asset price changes during the subscription period.':
    '价格来源：<span class="txt-gradient">COINBASE - BTC/USDT即市价格</span>。\n\n结算时，金库将自动检查交易期间的资产价格变化。',
  'If the asset price is always within the range (Lower Barrier ~ Upper Barrier) until settlement,<br/>users will earn Upside Returns at maturity.':
    '如果资产价格一直在区间范围内（下限 ~ 上限）直到结算，<br/>用户将在到期时获得额外的增强收益。',
  'Price stays fully within the range prior to settlement':
    '价格在结算前完全保持在区间范围内',
  'Price touches either of the barriers prior to settlement':
    '价格在结算前触及任一上下区间',
  'Users can take advantage of sideways markets with the Rangebound.<br/>If the asset price remains within the preset range during the period, users will earn Potential Yield.<br/>Should the price touch either the lower or upper barriers, users will still receive the Base Yield and RCH tokens.':
    '用户可以利用区间限定产品(Rangebound) 在横盘市场中获利。<br/>如果资产价格在此期间保持在预设区间内，用户将获得潜在收益。<br/>如果价格触及下限或上限障碍，用户仍将获得基础收益和RCH代币空投。',
  '* Price Source: Coinbase via Chainlink<br/>* {{name}} calculations are indicative and estimated based on current market conditions':
    '* 价格来源：通过Chainlink的Coinbase<br/>* {{name}}计算是按照当前市场价格估算的，仅供參考',
  Yield: '年化收益',
  Payout: '收益',
  'Bull Trend': '牛市趋势',
  'Earn Extra Yield on directional market movements':
    '通过市场方向性波动赚取额外收益',
  'Trend product is suitable for users who expect markets to move in one direction in a smooth and steady manner.':
    '趋势产品适合预期市场将平稳上涨或平稳下跌的用户',
  "As covered in our oracle section, SOFA utilizes ChainLink's Automation service as our settlement pricing source. Their service enables conditional execution of smart contract functions through a reliable and decentralized automation platform with a proven network of external node operations, currently securing over billions in TVL.":
    '如我们预言机部分所述，SOFA使用ChainLink的Automation服务作为我们的结算定价来源。他们的服务通过一个可靠和去中心化的自动化平台启用智能合约功能的条件执行，该平台拥有经验证的外部节点运作网络，目前保障数十亿总价值锁定（TVL）。',
  'If the asset price at expiry is higher than the lower strike,<br/>users will earn extra returns, which will be maximized at or above upper strike.':
    '如果到期时的资产价格高于较低行权价，<br/>用户将获得额外收益，且当资产价格达到或超过较高行权价时，额外收益将达到最大。',
  'The underlying price is above the upper strike at settlement':
    '结算时的标的价格高于较高行权价',
  'The underlying price is below the lower strike at settlement':
    '结算时的标的价格低于较低行权价',
  'The underlying price is between the lower strike and the upper strike at settlement':
    '结算时的标的价格位于较低行权价位与较高行权价之间',
  'The payoff will be derived based on a sliding scale between <b>Potential</b> and <b>Base+ Profits</b>.':
    '收益将根据<b>潜在收益</b>与<b>基础+ 收益</b>之间的比例来计算。',
  'Users expressing a bullish market view can benefit from the Bull Trend .<br/>If the asset price is within the range [K1 ~ K2] at expiry, payouts increase from the lower strike [K1] to the maximum at the upper strike [K2].<br/>If the price drops below [K1], investors still receive the Base Yield and RCH tokens.':
    '看涨市场的用户可以从牛市趋势产品中获益。<br/>如果资产价格在到期时在[K1 ~ K2]区间，用户的收益将根据标的资产价格，从较低行权价[K1]开始增加，到较高行权价[K2]达到最大。<br/>如果价格跌破[K1]，投资者仍然会获得基础收益和RCH代币空投。',
  '* Price Source: Data Feeds via Chainlink<br/>* {{name}} calculations are indicative and estimated based on current market conditions':
    '* 价格来源：通过Chainlink的Data Feeds<br/>* {{name}}的计算是根据当前市场价格估算的，因此仅供参考',
  'Bear Trend': '熊市趋势',
  'If the asset price at expiry is lower than the upper strike,<br/>users will earn extra returns, which will be maximized at or below lower strike.':
    '如果到期时的资产价格低于较高行权价，<br/>用户将获得额外收益，且当资产价格达到或超过较低行权价时，额外收益将达到最大。',
  'Users with a bearish market view can benefit from the Bear Trend.<br/>If the asset price is within the range [K1 ~ K2] at expiry,  payouts increase from the upper strike [K2] to the maximum at the lower strike [K1].<br/>If the price exceeds [K2], investors still receive the Base Yield and RCH tokens.':
    '看跌市场的用户可以从熊市趋势产品获利。<br/>如果到期时资产价格在[K1 ~ K2]区间，用户的收益将从较高行权价[K2]开始增加，到较低行权价[K1]时达到最大。<br/>如果价格高于[K2]，投资者仍然会获得基础收益和RCH代币。\n\n\n\n',
  'connect.succ': '导入成功',
  'protected.apy': '保障的年化',
  'rch.apy': 'RCH年化',
  'upside.apy': '增强年化',
  'More Info': '其他资讯',
  'Risk Disclosures': '风险揭露',
  Fold: '折叠',
  Twitter: 'Twitter',
  Discord: 'Discord',
  Telegram: 'Telegram',
  Medium: 'Medium',
  LinkedIn: 'LinkedIn',
  Unclaimed: '未领取',
  Claiming: '正在领取',
  Claimed: '已领取',
  PENDING: '待定',
  MINTED: '已铸造',
  FAILED: '失败',
  EXPIRED: '已过期',
  CLAIMING: '正在领取',
  CLAIMED: '已领取',
  'comp.error': '出现错误',
  refresh: '刷新',
  'A decentralized, non-profit, open-source technology organization<br/>looking to uphold the core values and spirit of DeFi in a professional and responsible manner.':
    '一个去中心化的、非营利的开源技术组织<br/>秉持专业和负责的态度，努力守护和发展去中心化金融的核心价值。',
  '{{tenor}} Day': '{{tenor}} 天',
  '{{tenor}} Days': '{{tenor}} 天',
  'A new version is ready, please reload the page':
    '新版本已准备好，请重新加载页面',
  'Ignore, and not display it for 30 minutes': '忽略，并在30分钟内不显示',
  Reload: '重新加载',
  'submitted-successful.a29e65119e9f7aa9dfabc6d1d1c2d0c4': '退币申请成功',
  'the-reward-has-been-.984b8a84318a40d21d62770f9b65a1b6': '该奖励已达成',
  'the-network-seems-to.bb2bfbb837a84228feb594acecf955c1':
    '网络似乎有些拥堵，请耐心等待...',
  'estimated-to-take-co.e2efef1497ef6791ea533b77c33fa4c7':
    '预计需要 {{count}} 秒',
  'exchanging.2680ff4e0bb12d654c70b6afb89130e2': '兑换中',
  'game-points.31b0750450702389891a5a38e84a4991': '游戏币',
  'after-topping-up-ple.1ba1506203428a9ba14642728522e5dd':
    '充值后，请耐心等待10分钟后刷新页面，检查游戏币是否到账。若没有，请在此处填写您交易的哈希值：',
  'submit-successfully.88e12461ca542c5471f3d9e47d7e0ec4': '提交成功',
  'submit.40e07c463c6f70709514ecdeba6efb14': '提交',
  'received-amount-game.13c286d943a45b0846d68dda5417fc18':
    '充值获得 {{amount}} 游戏币',
  'session-timeout-plea.949cf974192d991867bf68bfd321c312':
    '会话超时，请重新登入',
  ...semiLocale,
};
