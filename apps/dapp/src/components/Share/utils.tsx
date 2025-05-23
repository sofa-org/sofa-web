import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/base-type';
import { TFunction } from '@sofa/services/i18n';
import * as htmlToImage from 'html-to-image';

export function useAutomatorShareInfo(options: {
  vault: PartialRequired<VaultInfo, 'vault'>;
  t: TFunction;
}) {
  const r = useMemo(() => {
    const shareLink = `${location.protocol}//${location.host}/a?v=${options.vault.vault.toLowerCase()}&c=${options.vault.chainId}`;

    return {
      shareLink,
      shareText: options.t(
        {
          enUS: 'Create an Automator to become an investment leader / One-click follow investment to enjoy profit sharing:\n{{shareLink}}',
          zhCN: '创建一个Automator成为投资领袖 / 一键跟投享受利润分成：\n{{shareLink}}',
        },
        { shareLink },
      ),
    };
  }, [options.vault]);
  return r;
}

export async function captureAndCopyImage(options: {
  selector: string;
  capturingClassName: string;
  filter?: (domNode: HTMLElement) => boolean;
  maskElementClassName?: string;
  getCapturingElement: () => HTMLElement;
  onCaptured?: (success: boolean) => void;
}) {
  let maskElement: HTMLDivElement | undefined = undefined;
  let reactRoot: ReturnType<typeof createRoot> | undefined = undefined;
  if (options.maskElementClassName) {
    maskElement = document.createElement('div');
    maskElement.className = options.maskElementClassName;
    document.body.appendChild(maskElement);
    reactRoot = createRoot(maskElement);
    reactRoot.render(<Spin size="large" />);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  const element = options.getCapturingElement();
  element.className = element.className + ' ' + options.capturingClassName;
  await new Promise((resolve) => setTimeout(resolve, 0));
  // window.devicePixelRatio = 2;
  const blob = await htmlToImage.toBlob(element, {
    // pixelRatio: 2,
    // skipAutoScale: true,
    filter: options.filter,
  });
  if (maskElement) {
    document.body.removeChild(maskElement);
    if (reactRoot) {
      reactRoot.unmount();
    }
  }
  element.className = element.className.replace(options.capturingClassName, '');
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('download', 'ShareImage.png');
  if (!blob) {
    options.onCaptured?.(false);
    Toast.error('Save picture failed');
    return;
  }
  options.onCaptured?.(true);
  try {
    navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
  } catch (error) {
    const url = URL.createObjectURL(blob);
    downloadLink.setAttribute('href', url);
    downloadLink.click();
  }
}
