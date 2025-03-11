import semiLocale from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';

export default {
  Earn: 'Earn',
  'Capital Secured Earnings': '安全收益',
  Secured: '安全的',
  'By smartly combining the safety of savings income with a sprinkle of embedded options, your principal is securely generating yield in trusted DeFi protocols such as Aave/Lido/Sofa/Curve/Avalon, while a portion of that income will be funding upside option structures for a chance at extra gains.  Perfect for the risk conscious user who wants to benefit from upside gains with minimal downside.':
    'SOFA巧妙地融合了安全储蓄和嵌入式期权，用户的本金会在 Aave/Lido/Sofa/Curve/Avalon 等可信赖的DeFi协议中安全生息，同时部分利息收入将用于购买期权，为用户带来额外的收益机会。这非常适合注重风险控制，同时希望获取潜在高收益的投资者。',
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
  'deposit-token.20c0260317aa889f2b377a95c735422c': '申购币种',
  'blog.4ab246bb4eec96fce229264aa8d10eae': '博客',
  'please-login-again.0dbc90b7b508c2eb2a9d70ecc95f535c': '请重新登入',
  'stable-yield-and-low.65a54fa830de92ea85cda6ee10d04044':
    '稳定收益，低风险。适合追求稳定回报的风险规避型用户。',
  'high-returns-high-ri.79ac67d13ee4efe29e30c188ec4b8521':
    '高回报 & 高风险。为能够承受潜在亏损的冒险者量身打造。',
  'automator.46a5369c4464dd268110ab0de1bd1657': 'Automator',
  'delegate-your-funds-.c6ce2b17d026749a772728d3b6d40f7c':
    '将资金托管给高绩效的 Automator 交易者及策略。资金将被充分利用，持续再投资以实现最佳回报，直至用户赎回。',
  'mirror-the-top-trade.f8543a55e11c908a1f1b156ca5045d41':
    '一键复制顶级交易者的持仓！',
  'no-losses-please.0f9742b00b40f59e6824d8b5c3a8165a': '不接受损失',
  'no-pain-no-gain.1c8744c9fa5ce1f32afc533b71db74d1': '能接受少量损失',
  'risking-it-all.070f7f3e406bf673a761d5d4d5c505f9': '能接受全部损失',
  'go-up.7e82a152fb3a1c6b8d191c4dcf931556': '上涨',
  'buy.ca960736662e4ef39502f054cf1e1527': '买涨',
  'buy.b23bbaa0a3e087503800044434e42a4c': '买',
  'smart-trend.ee6c829cbef3f0449622f574955a9a22': 'Smart Trend',
  'reference-probabilit.2357e3b26e59f852aee92fca053318cd':
    '参考概率 ≥{{strike}}: <span class="bold">{{value}}</span>',
  'flat.28b2886a8c3efb0ef1b3293ef477ac99': '震荡',
  'rangebound.c420b3b938ac9b23670b951dd232c244': 'Rangebound',
  'reference-probabilit.b539115fc3dbef91ef3db3c7192a63f2':
    '始终在范围内的参考概率: <span class="bold">{{value}}</span>',
  'go-down.ab97c898a320aab92d3d20d1bfd9cdeb': '下跌',
  'sell.f4698cdf10f69d74bea287a260e9ed72': '买跌',
  'sell.96fd3d0cb48843b0b3bb3ded34efdb74': '卖',
  'reference-probabilit.97b6f1bdc037ed95556518a56818d96d':
    '参考概率 ≤{{strike}}: <span class="bold">{{value}}</span>',
  'poker-museum-.ee868eac75d64d61f39d7396aec6d131': '扑克博物馆 🃏',
  '-congratulations-on-.60dc38f99ee496d103b706636e5b8cd2':
    '🎉 恭喜您完成【扑克博物馆】任务，赢得待抽取扑克卡牌，每张扑克最高可兑换 100 $RCH！',
  '-please-visit-the-po.5273091a1fc930ef7236c26ffc9efb3e':
    '⏰ 请在下一个 16:00 UTC+8 后，前往【扑克博物馆】领取您的扑克，24 小时过期，请在有效期内领取。',
  '-draw-now.49e5a1360ab6d1893338e8d5c46b53e9': '🎉 立即领取',
  'holder.71ce12cd42e3af3d0392d5cc39e9dd37': '持有者',
  'hold-rch-like-a-diam.828feea49316a07bccb0cb35cf3c3cdc':
    '像钻石一样持有的 RCH',
  'distributed-accordin.908b049d2aff9b5d5421850d666171b9':
    '根据最终快照数据进行分发。',
  'purchase-now.7b06ba1b2c5331f2d1fef50b51c83bf2': '去购买',
  'sofa-interaction.30f2f3c335f2c87ecbc5b3364744b51f': 'SOFA 交互',
  'interact-with-sofa-p.f904ca23e7169e3e7ba04c8c73c4a3bc':
    '与 Sofa 产品进行互动。',
  'including-but-not-li.dd85dc3ec9eb1d3d97bbda5f188a287c':
    '包括但不限于交易、游戏和销毁。',
  'trade.98212aa0a6fedbe1bbfc114f7d097c13': '交易',
  'community.f49b903c173f827b4117b445390e57d0': '社区',
  'participating-in-sof.f1e5f78e0b7126a1e83db0c5ffa3c6a9':
    '参与 Sofa 的社区活动。',
  'join-in-official-soc.f9008a8dfe2819f0e38bb612b29dd052':
    '加入官方社交媒体账户，参与各种社区活动。',
  'one-more-thing.2a03c30ef06818823181a744f3cae74a': '更多',
  'stay-tuned-to-sofa.11e687901b00859b75e28da12f01e11f': '持续关注 Sofa。​',
  'more-sofa-ecosystem-.04f741ad923de3910f5e01bd50cbf15f':
    '更多 Sofa 生态系统产品即将推出。​',
  'game.8bde4e5bda3d3c87cb844aef5225131e': '游戏',
  'telegram.d320b77903562cabccb67ba1629177f6': 'Telegram',
  'burn.7b86f20909c5173a286cd5e6c0e524e9': '销毁',
  'holder.e5cafbef05813db18d95e5d9c216c09d': '持有',
  'other.31a13f323c80030a835db6d4af4ec0b8': '其它',
  'core-mode.dff507244abc1ca7cc24c48b39eaa7c4': '标准模式',
  'follow-the-best.a74d40295054122785735fa141771e54': '跟单',
  'professional.d7c916b7adf0a9138d9b0ed3e92b971a': '专业模式',
  'all.cbeb67196fb55e8e1c2c80674609a0f7': '全部',
  'portfolio.0e1cd57d12f3c38a0b2adcdfef1efec3': '我参与的',
  'create-automator.516e2b9e91a684ea57b034f3ca80bfb5': '创建 Automator',
  'ultra-safe.b8926c6eb0fa38fc5459f7096441fe4b': '超安全',
  'minimal-risk.ef83d65ad34ff19cfc3704b2d7a4a202': '最小风险',
  'low-risk.78a9e896ca14028ee5cf5d85ce143bd2': '低风险',
  'moderate-risk.8f97778dd530ee7a3c057b4b03436102': '中等风险',
  'high-risk.ee691e2b9768ea4b1f2a25f779298f54': '高风险',
  'very-high-risk.12cb2700582201dde4945b6a17ec9e38': '超高风险',
  'active.b62d974a42f3d613375e4e5d9c6d6f17': '正在持仓',
  'closed.55be5ba9b234bc5c0d56153fdeea298b': '已提现',
  'create-an-automator-.158cbc34b374babbbcf0799a4f529860':
    '创建一个Automator成为投资领袖 / 一键跟投享受利润分成：\n{{shareLink}}',
  ...semiLocale,
};
