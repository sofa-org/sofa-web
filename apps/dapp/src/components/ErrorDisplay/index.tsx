import { useState } from 'react';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { getErrorMsg } from '@sofa/utils/fns';
import classNames from 'classnames';

import { Comp as IconCopy } from '@/assets/icon-copy.svg';
import { addI18nResources } from '@/locales';

import { getErrorSummary } from './errorMapping';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ErrorDisplay');

export interface ErrorDisplayContext {
  vault?: string;
  chainId?: number;
  /** IDs label, e.g. "QuoteIds" or "PositionIds" */
  idsLabel?: string;
  /** IDs to display in details */
  ids?: (string | number)[];
}

export interface ErrorDisplayProps {
  /** Raw error object or string */
  error: unknown;
  /** Context info to include when copying */
  context?: ErrorDisplayContext;
  className?: string;
  style?: React.CSSProperties;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = (props) => {
  const { error, context, className, style } = props;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [t, { language }] = useTranslation('ErrorDisplay');

  const rawError = getErrorMsg(error);
  const summary = getErrorSummary(rawError, language);

  const idsLabel = context?.idsLabel;
  const ids = context?.ids ?? [];
  const hasIdsInfo = !!idsLabel;
  // Check if there's more content to show
  const hasDetails = hasIdsInfo || (rawError && rawError !== summary);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const copyContent = JSON.stringify(
      {
        summary,
        vault: context?.vault,
        chain: context?.chainId ? ChainMap[context.chainId]?.name : undefined,
        ids: context?.ids,
        rawError,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    );

    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!rawError && !hasIdsInfo) return <>-</>;

  return (
    <div
      className={classNames(styles['error-display'], className)}
      style={style}
    >
      {/* Summary */}
      <div className={styles['summary']}>{summary}</div>

      {/* Toggle button - only show when there's more content */}
      {hasDetails && (
        <div
          className={styles['toggle']}
          onClick={() => setExpanded(!expanded)}
        >
          <span className={styles['arrow']}>
            {expanded ? '\u25BC' : '\u25B6'}
          </span>
          <span>{expanded ? t('Hide details') : t('Show details')}</span>
          {expanded && (
            <span
              className={classNames(styles['copy-btn'], {
                [styles['copied']]: copied,
              })}
              onClick={handleCopy}
              title={copied ? t('Copied!') : t('Copy')}
            >
              <IconCopy />
            </span>
          )}
        </div>
      )}

      {/* Expanded details area */}
      {expanded && hasDetails && (
        <div className={styles['details']}>
          {(idsLabel || rawError) && (
            <div className={styles['raw-error']}>
              {idsLabel && (
                <div className={styles['ids-line']}>
                  {idsLabel}: {ids.join(', ')}
                </div>
              )}
              {rawError && (
                <div className={styles['raw-error-text']}>{rawError}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { getErrorSummary } from './errorMapping';
