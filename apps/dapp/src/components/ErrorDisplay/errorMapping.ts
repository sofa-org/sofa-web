/**
 * Error mapping and summary extraction utilities
 * Priority: Error mapping table > Extract revert reason > Truncate
 */

// ========== Error Pattern Mapping ==========
const ERROR_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  // Balance / Funds insufficient
  { pattern: /insufficient funds/i, key: 'INSUFFICIENT_FUNDS' },
  { pattern: /transfer amount exceeds balance/i, key: 'INSUFFICIENT_BALANCE' },
  { pattern: /exceeds balance/i, key: 'INSUFFICIENT_BALANCE' },
  { pattern: /SafeERC20/i, key: 'INSUFFICIENT_BALANCE' },
  {
    pattern: /balance.*(not enough|insufficient)/i,
    key: 'INSUFFICIENT_BALANCE',
  },

  // Allowance insufficient
  { pattern: /insufficient allowance/i, key: 'INSUFFICIENT_ALLOWANCE' },
  { pattern: /allowance/i, key: 'INSUFFICIENT_ALLOWANCE' },

  // User actions
  { pattern: /user rejected/i, key: 'USER_REJECTED' },
  { pattern: /user denied/i, key: 'USER_REJECTED' },
  { pattern: /user cancel/i, key: 'USER_REJECTED' },
  { pattern: /rejected by user/i, key: 'USER_REJECTED' },

  // Business errors
  { pattern: /Mint Failed/, key: 'MINT_FAILED_TIMEOUT' },
  { pattern: /Vault: deadline/, key: 'MINT_FAILED_TIMEOUT' },
  { pattern: /Vault: invalid maker signature/, key: 'INVALID_SIGNATURE' },
  { pattern: /Vault: signature consumed/, key: 'SIGNATURE_CONSUMED' },
  { pattern: /missing revert data.*estimateGas/i, key: 'SIGNATURE_CONSUMED' },
  { pattern: /already claimed/i, key: 'ALREADY_CLAIMED' },
  { pattern: /automator already exists/, key: 'AUTOMATOR_ALREADY_EXISTS' },
  { pattern: /insufficient credits/, key: 'INSUFFICIENT_CREDITS' },
  { pattern: /Automator: insufficient shares/, key: 'INSUFFICIENT_SHARES' },
  {
    pattern: /Automator: insufficient collateral to redeem/,
    key: 'INSUFFICIENT_COLLATERAL_REDEEM',
  },
  { pattern: /Automator: invalid maker/, key: 'INVALID_SIGNATURE' },

  // Gas related
  { pattern: /nonce.*too low/i, key: 'NONCE_TOO_LOW' },
  { pattern: /replacement.*underpriced/i, key: 'GAS_UNDERPRICED' },
  { pattern: /gas.*too low/i, key: 'GAS_TOO_LOW' },
  { pattern: /out of gas/i, key: 'GAS_TOO_LOW' },
  { pattern: /UNPREDICTABLE_GAS_LIMIT/i, key: 'UNPREDICTABLE_GAS' },

  // Network related
  { pattern: /timeout/i, key: 'TIMEOUT' },
  { pattern: /network error/i, key: 'NETWORK_ERROR' },
  { pattern: /network changed/i, key: 'NETWORK_CHANGED' },
  { pattern: /failed to fetch/i, key: 'NETWORK_ERROR' },
  { pattern: /websocket.*failed/i, key: 'NETWORK_ERROR' },

  // Contract errors
  { pattern: /call revert exception/i, key: 'CONTRACT_REVERT' },
  { pattern: /transaction failed/i, key: 'TX_FAILED' },
  { pattern: /execution reverted$/i, key: 'CONTRACT_REVERT' },

  // Slippage / Price
  { pattern: /slippage/i, key: 'SLIPPAGE_ERROR' },
  { pattern: /price.*changed/i, key: 'PRICE_CHANGED' },
  { pattern: /quote.*expired/i, key: 'QUOTE_EXPIRED' },
];

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  INSUFFICIENT_FUNDS: {
    'en-US': 'Insufficient funds for gas',
    'zh-CN': '余额不足以支付 Gas 费用',
    'zh-HK': '餘額不足以支付 Gas 費用',
    'zh-TW': '餘額不足以支付 Gas 費用',
    'ja-JP': 'ガス代の残高が不足しています',
    'ru-RU': 'Недостаточно средств для газа',
  },
  INSUFFICIENT_BALANCE: {
    'en-US': 'Insufficient balance',
    'zh-CN': '代币余额不足',
    'zh-HK': '代幣餘額不足',
    'zh-TW': '代幣餘額不足',
    'ja-JP': 'トークン残高が不足しています',
    'ru-RU': 'Недостаточный баланс токенов',
  },
  INSUFFICIENT_ALLOWANCE: {
    'en-US': 'Token allowance not enough, please approve first',
    'zh-CN': '授权额度不足，请先进行授权',
    'zh-HK': '授權額度不足，請先進行授權',
    'zh-TW': '授權額度不足，請先進行授權',
    'ja-JP': 'トークンの承認が不足しています。先に承認してください',
    'ru-RU': 'Недостаточный лимит токенов, сначала одобрите',
  },
  USER_REJECTED: {
    'en-US': 'Transaction rejected by user',
    'zh-CN': '用户取消了交易',
    'zh-HK': '用戶取消了交易',
    'zh-TW': '用戶取消了交易',
    'ja-JP': 'ユーザーがトランザクションを拒否しました',
    'ru-RU': 'Транзакция отклонена пользователем',
  },
  MINT_FAILED_TIMEOUT: {
    'en-US': 'Operation timed out',
    'zh-CN': '操作超时',
    'zh-HK': '操作逾時',
    'zh-TW': '操作超時',
    'ja-JP': '操作がタイムアウトしました',
    'ru-RU': 'Операция превысила время ожидания',
  },
  INVALID_SIGNATURE: {
    'en-US': 'Invalid signature. Please request a new quote',
    'zh-CN': '签名无效，请重新获取报价',
    'zh-HK': '簽名無效，請重新獲取報價',
    'zh-TW': '簽名無效，請重新取得報價',
    'ja-JP': '署名が無効です。新しい見積もりを取得してください',
    'ru-RU': 'Неверная подпись. Запросите новую котировку',
  },
  SIGNATURE_CONSUMED: {
    'en-US': 'Too many requests or duplicate product parameters',
    'zh-CN': '请求过于频繁或产品参数重复',
    'zh-HK': '請求過於頻繁或產品參數重複',
    'zh-TW': '請求過於頻繁或產品參數重複',
    'ja-JP': 'リクエストが多すぎるか、製品パラメータが重複しています',
    'ru-RU': 'Слишком много запросов или параметры продукта дублируются',
  },
  ALREADY_CLAIMED: {
    'en-US': 'This reward has already been claimed',
    'zh-CN': '该奖励已领取',
    'zh-HK': '該獎勵已領取',
    'zh-TW': '該獎勵已領取',
    'ja-JP': 'この報酬はすでに受け取られています',
    'ru-RU': 'Эта награда уже получена',
  },
  AUTOMATOR_ALREADY_EXISTS: {
    'en-US': 'An automator already exists',
    'zh-CN': '已存在相同的 Automator',
    'zh-HK': '已存在相同的 Automator',
    'zh-TW': '已存在相同的 Automator',
    'ja-JP': '同じ Automator はすでに存在します',
    'ru-RU': 'Такой Automator уже существует',
  },
  INSUFFICIENT_CREDITS: {
    'en-US': 'Insufficient credits. Please confirm 500 RCH has been burned',
    'zh-CN': '权益不足，请确认已销毁500 RCH',
    'zh-HK': '權益不足，請確認已銷毀500 RCH',
    'zh-TW': '權益不足，請確認已銷毀500 RCH',
    'ja-JP': 'クレジットが不足しています。500 RCHが焼却済みか確認してください',
    'ru-RU': 'Недостаточно прав. Убедитесь, что 500 RCH сожжены',
  },
  INSUFFICIENT_SHARES: {
    'en-US': 'Insufficient shares. Please redeem fewer shares',
    'zh-CN': '份额不足，请减少赎回份额',
    'zh-HK': '份額不足，請減少贖回份額',
    'zh-TW': '份額不足，請減少贖回份額',
    'ja-JP': 'シェアが不足しています。償還数量を減らしてください',
    'ru-RU': 'Недостаточно долей. Уменьшите количество для выкупа',
  },
  INSUFFICIENT_COLLATERAL_REDEEM: {
    'en-US': 'Position not yet expired. Please redeem later',
    'zh-CN': '持仓未到期，请稍后赎回',
    'zh-HK': '持倉未到期，請稍後贖回',
    'zh-TW': '持倉未到期，請稍後贖回',
    'ja-JP': 'ポジションはまだ期限に達していません。後で償還してください',
    'ru-RU': 'Позиция ещё не истекла. Повторите попытку позже',
  },
  NONCE_TOO_LOW: {
    'en-US': 'Transaction already processed, please refresh',
    'zh-CN': '交易已被处理，请刷新页面',
    'zh-HK': '交易已被處理，請刷新頁面',
    'zh-TW': '交易已被處理，請刷新頁面',
    'ja-JP': 'トランザクションは既に処理されました。更新してください',
    'ru-RU': 'Транзакция уже обработана, обновите страницу',
  },
  GAS_UNDERPRICED: {
    'en-US': 'Gas price too low, please retry',
    'zh-CN': 'Gas 价格过低，请重试',
    'zh-HK': 'Gas 價格過低，請重試',
    'zh-TW': 'Gas 價格過低，請重試',
    'ja-JP': 'ガス価格が低すぎます。再試行してください',
    'ru-RU': 'Цена газа слишком низкая, повторите попытку',
  },
  GAS_TOO_LOW: {
    'en-US': 'Gas limit too low, please retry',
    'zh-CN': 'Gas 限制过低，请重试',
    'zh-HK': 'Gas 限制過低，請重試',
    'zh-TW': 'Gas 限制過低，請重試',
    'ja-JP': 'ガスリミットが低すぎます。再試行してください',
    'ru-RU': 'Лимит газа слишком низкий, повторите попытку',
  },
  UNPREDICTABLE_GAS: {
    'en-US': 'Cannot estimate gas, transaction may fail',
    'zh-CN': '无法估算 Gas，交易可能失败',
    'zh-HK': '無法估算 Gas，交易可能失敗',
    'zh-TW': '無法估算 Gas，交易可能失敗',
    'ja-JP': 'ガスを推定できません。トランザクションが失敗する可能性があります',
    'ru-RU': 'Невозможно оценить газ, транзакция может не пройти',
  },
  TIMEOUT: {
    'en-US': 'Request timeout, please retry',
    'zh-CN': '请求超时，请重试',
    'zh-HK': '請求超時，請重試',
    'zh-TW': '請求超時，請重試',
    'ja-JP': 'リクエストがタイムアウトしました。再試行してください',
    'ru-RU': 'Тайм-аут запроса, повторите попытку',
  },
  NETWORK_ERROR: {
    'en-US': 'Network error, please check connection',
    'zh-CN': '网络错误，请检查连接',
    'zh-HK': '網絡錯誤，請檢查連接',
    'zh-TW': '網絡錯誤，請檢查連接',
    'ja-JP': 'ネットワークエラー、接続を確認してください',
    'ru-RU': 'Ошибка сети, проверьте подключение',
  },
  NETWORK_CHANGED: {
    'en-US': 'Network changed, please retry',
    'zh-CN': '网络已切换，请重试',
    'zh-HK': '網絡已切換，請重試',
    'zh-TW': '網絡已切換，請重試',
    'ja-JP': 'ネットワークが変更されました。再試行してください',
    'ru-RU': 'Сеть изменилась, повторите попытку',
  },
  CONTRACT_REVERT: {
    'en-US': 'Contract execution failed',
    'zh-CN': '合约执行失败',
    'zh-HK': '合約執行失敗',
    'zh-TW': '合約執行失敗',
    'ja-JP': 'コントラクトの実行に失敗しました',
    'ru-RU': 'Ошибка выполнения контракта',
  },
  TX_FAILED: {
    'en-US': 'Transaction failed',
    'zh-CN': '交易失败',
    'zh-HK': '交易失敗',
    'zh-TW': '交易失敗',
    'ja-JP': 'トランザクションが失敗しました',
    'ru-RU': 'Транзакция не удалась',
  },
  SLIPPAGE_ERROR: {
    'en-US': 'Slippage too high, please adjust settings',
    'zh-CN': '滑点过高，请调整设置',
    'zh-HK': '滑點過高，請調整設置',
    'zh-TW': '滑點過高，請調整設置',
    'ja-JP': 'スリッページが高すぎます。設定を調整してください',
    'ru-RU': 'Слишком высокое проскальзывание, измените настройки',
  },
  PRICE_CHANGED: {
    'en-US': 'Price changed, please retry',
    'zh-CN': '价格已变动，请重试',
    'zh-HK': '價格已變動，請重試',
    'zh-TW': '價格已變動，請重試',
    'ja-JP': '価格が変更されました。再試行してください',
    'ru-RU': 'Цена изменилась, повторите попытку',
  },
  QUOTE_EXPIRED: {
    'en-US': 'Quote expired, please request new quote',
    'zh-CN': '报价已过期，请重新获取报价',
    'zh-HK': '報價已過期，請重新獲取報價',
    'zh-TW': '報價已過期，請重新獲取報價',
    'ja-JP': '見積もりの有効期限が切れました。新しい見積もりを取得してください',
    'ru-RU': 'Котировка истекла, запросите новую',
  },
};

// ========== Extract Revert Reason ==========
function extractRevertReason(error: string): string | null {
  const patterns = [
    // "execution reverted: some message"
    /execution reverted:\s*"?([^"]+)"?/i,
    // reverted with reason string 'message'
    /reverted with reason string\s*'([^']+)'/i,
    // reason="message"
    /reason="([^"]+)"/i,
    // revert message (before "at" or end)
    /revert\s+(.+?)(?:\s*at\s|$)/i,
    // Error: message (
    /Error:\s*([^(]+)/i,
    // shortMessage from ethers
    /shortMessage:\s*"([^"]+)"/i,
  ];

  for (const p of patterns) {
    const match = error.match(p);
    if (match?.[1]) {
      const reason = match[1].trim();
      // Skip if it's just a generic message
      if (
        reason &&
        reason.length > 2 &&
        !/^(error|failed|revert)$/i.test(reason)
      ) {
        return reason.slice(0, 100);
      }
    }
  }
  return null;
}

// ========== Main Export ==========
const TRUNCATE_LENGTH = 60;

export function getErrorSummary(rawError: string, locale = 'en-US'): string {
  if (!rawError) return '-';

  const errorStr = String(rawError);

  // Priority 1: Match error pattern table
  for (const { pattern, key } of ERROR_PATTERNS) {
    if (pattern.test(errorStr)) {
      const messages = ERROR_MESSAGES[key];
      if (messages) {
        return messages[locale] || messages['en-US'] || key;
      }
    }
  }

  // Priority 2: Extract revert reason from contract error
  const revertReason = extractRevertReason(errorStr);
  if (revertReason) {
    return revertReason;
  }

  // Priority 3: Truncate to first N characters
  if (errorStr.length <= TRUNCATE_LENGTH) {
    return errorStr;
  }
  return errorStr.slice(0, TRUNCATE_LENGTH) + '...';
}

export { ERROR_MESSAGES, ERROR_PATTERNS };
