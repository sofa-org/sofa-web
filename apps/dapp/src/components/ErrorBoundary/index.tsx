import { Component, CSSProperties, ErrorInfo, ReactNode } from 'react';
import { Translation } from 'react-i18next';
import { Button, Empty } from '@douyinfe/semi-ui';
import { t } from '@sofa/services/i18n';
import classNames from 'classnames';

import { Comp as ImgError } from '@/assets/error.svg';

import styles from './index.module.scss';

interface ErrorBoundaryProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState((pre) => ({ ...pre, error, errorInfo }));
  }

  render() {
    return this.state.error ? (
      <Empty
        className={classNames(styles['error-boundary'], this.props.className)}
        style={this.props.style}
        image={
          <ImgError
            width={200 / window.winScale}
            height={200 / window.winScale}
          />
        }
        title={
          <Translation>{(t_) => t('comp.error', {}, { t: t_ })}</Translation>
        }
        description={
          <>
            <p className={styles['error-stack']}>
              Error: {this.state.error.message}
            </p>
            {this.state.errorInfo?.componentStack
              ?.split(/[\n\r]/)
              .map((it, i) => (
                <p className={styles['error-stack']} key={i}>
                  {it}
                </p>
              ))}
          </>
        }
      >
        <Button
          className="btn-ghost"
          size="large"
          onClick={() => location.reload()}
        >
          <Translation>{(t_) => t('refresh', {}, { t: t_ })}</Translation>
        </Button>
      </Empty>
    ) : (
      this.props.children
    );
  }
}

export default ErrorBoundary;
