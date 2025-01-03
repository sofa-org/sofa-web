import { useMemo, useRef } from 'react';
import {
  Button,
  Col,
  Form,
  Modal,
  Progress,
  Row,
  Spin,
  Toast,
  Tooltip,
} from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import {
  AutomatorCreateParams,
  AutomatorCreatorService,
} from '@sofa/services/automator-creator';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import { copy } from 'clipboard';

import AsyncButton from '@/components/AsyncButton';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useWalletStore } from '@/components/WalletConnector/store';

import { Comp as IconInfo } from './assets/icon-info.svg';
import { Comp as IconLoading } from './assets/icon-loading.svg';
import {
  AutomatorCreateStoreType,
  getNameForChain,
  isMockAPI,
  useAutomatorCreateStore,
} from './store';

import styles from './index-model.module.scss';

const steps: {
  arrived: (store: AutomatorCreateStoreType) => boolean;
  processPercent: number;
  step1?: boolean;
  step2?: boolean;
  comp: () => JSX.Element[] | JSX.Element;
}[] = [
  {
    arrived: (store) => !!store.automatorCreateResult,
    processPercent: 100,
    step1: true,
    step2: true,
    comp: () => <StepFinished />,
  },
  {
    arrived: (store) => store.automatorCreating,
    processPercent: 75,
    step1: true,
    comp: () => <StepCreating />,
  },
  {
    arrived: (store) => store.rchBurned,
    processPercent: 50,
    step1: true,
    comp: () => <StepForm />,
  },
  {
    arrived: (store) => store.rchBurning,
    processPercent: 30,
    comp: () => <StepBurning />,
  },
  {
    arrived: (store) => true,
    processPercent: 5,
    comp: () => <StepStart />,
  },
];
const StepStart = () => {
  const [t] = useTranslation('AutomatorCreate');
  const { chainId } = useWalletStore();
  const { payload } = useAutomatorCreateStore();
  const burn = useLazyCallback(async () => {
    const factory = payload.factory;
    if (!factory) {
      return;
    }
    try {
      if (chainId != AutomatorCreatorService.rchAmountForBurning) {
        // switch chain
        await useWalletStore.setChain(
          AutomatorCreatorService.rchBurnContract.chainId,
        );
      }
      useAutomatorCreateStore.setState({
        rchBurning: true,
      });
      // burn
      const hash = await AutomatorCreatorService.burnRCHBeforeCreate(
        () => {},
        factory,
      );

      useAutomatorCreateStore.setState({
        rchBurned: true,
        payload: {
          ...useAutomatorCreateStore.getState().payload,
          burnTransactionHash: hash,
        },
      });
    } catch (e) {
      if (isMockAPI) {
        useAutomatorCreateStore.setState({
          rchBurned: true,
          payload: {
            ...useAutomatorCreateStore.getState().payload,
            burnTransactionHash: '0xMockHash',
          },
        });
        return;
      }
      useAutomatorCreateStore.getState().reset();
      console.error('error burn rch for automator creation', e);
      Toast.error(getErrorMsg(e));
    }
  });
  return (
    <div className={styles['step-1-start']}>
      <div className={styles['rch-amount']}>
        <span className={styles['amount']}>
          {AutomatorCreatorService.rchAmountForBurning}
        </span>{' '}
        RCH
      </div>
      <AsyncButton
        className={classNames(styles['confirm-btn'], 'btn-primary')}
        onClick={() => burn()}
      >
        {chainId == AutomatorCreatorService.rchBurnContract.chainId
          ? t({
              enUS: 'Confirm to Burn',
            })
          : t(
              {
                enUS: 'Switch to {{chainName}} to Burn',
              },
              {
                chainName: getNameForChain(
                  AutomatorCreatorService.rchBurnContract.chainId,
                  t,
                ),
              },
            )}
      </AsyncButton>
    </div>
  );
};
const StepBurning = () => {
  const [t] = useTranslation('AutomatorCreate');
  return (
    <div className={styles['step-2-burning']}>
      <Spin indicator={<IconLoading />} />
      <div className={styles['desc']}>
        {t({
          enUS: 'Processing, Please Do Not Close This Page',
        })}
      </div>
    </div>
  );
};
const StepForm = () => {
  const api = useRef<FormApi>();
  const [t] = useTranslation('AutomatorCreate');
  const { payload, updatePayload } = useAutomatorCreateStore();
  const { chainId } = useWalletStore();
  const isMobileUI = useIsMobileUI();
  const deploy = useLazyCallback(async () => {
    const values = (await api.current
      ?.validate()
      .catch((r) => undefined)) as unknown as AutomatorCreateParams | undefined;
    if (!values) {
      return;
    }
    updatePayload(values);

    const _payload = payload;
    const factory = _payload.factory;
    if (!_payload || !factory) {
      return;
    }
    try {
      if (chainId != factory.chainId) {
        // switch chain
        await useWalletStore.setChain(factory.chainId);
      }
      useAutomatorCreateStore.setState({
        automatorCreating: true,
      });
      const result = await AutomatorCreatorService.createAutomator(
        () => {},
        _payload as AutomatorCreateParams,
      );

      useAutomatorCreateStore.setState({
        automatorCreating: false,
        automatorCreateResult: result,
      });
    } catch (e) {
      if (isMockAPI) {
        useAutomatorCreateStore.setState({
          automatorCreating: false,
          automatorCreateResult: '0xMockResult',
        });
        return;
      }
      console.error(e);
      Toast.error(getErrorMsg(e));
    }
  });
  return (
    <div className={styles['step-3-form']}>
      <Form
        labelPosition="top"
        initValues={payload}
        getFormApi={(formApi) => (api.current = formApi)}
      >
        <Row>
          <Col span={24}>
            <Form.Input
              field="automatorName"
              label={t({
                enUS: 'Automator Name',
              })}
              trigger="blur"
              rules={[
                {
                  required: true,
                  message: t({
                    enUS: 'This field is required',
                  }),
                },
              ]}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Select
              field="redemptionWaitingPeriod"
              label={
                <>
                  {t({
                    enUS: 'Redemption Waiting Period',
                  })}
                  <Tooltip
                    style={{
                      maxWidth: isMobileUI ? '80vw' : '500px',
                    }}
                    content={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: t({
                            enUS: `The Redemption Waiting Period refers to the time users must wait after submitting a redemption request for their funds to become claimable. Additionally, this period determines the maximum expiration date range for options tradable by the Automator manager.`,
                          }).replace(/\n/g, '<br />'),
                        }}
                      />
                    }
                  >
                    <IconInfo className={styles['icon-info']} />
                  </Tooltip>
                  <div className={styles['field-desc']}>
                    {t({
                      enUS: 'You can only trade products with expiration dates within the selected waiting period.',
                    })}
                  </div>
                </>
              }
              trigger="blur"
              rules={[
                {
                  required: true,
                  message: t({
                    enUS: 'This field is required',
                  }),
                },
              ]}
            >
              <Form.Select.Option value={'7'}>7D</Form.Select.Option>
              <Form.Select.Option value={'14'}>14D</Form.Select.Option>
              <Form.Select.Option value={'30'}>30D</Form.Select.Option>
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.RadioGroup
              field="sharePercent"
              label={
                <>
                  {t({
                    enUS: 'Profits Share Ratio',
                  })}
                  <Tooltip
                    style={{
                      maxWidth: isMobileUI ? '80vw' : '500px',
                    }}
                    content={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: t({
                            enUS: `The Profits Share Ratio defines the percentage of user profits that the Automator manager can share as their performance fee. If the Automator generates losses, the shared profits are recorded as negative until the account balance turns positive again. Only then can the manager resume withdrawing profit shares.`,
                          }).replace(/\n/g, '<br />'),
                        }}
                      />
                    }
                  >
                    <IconInfo className={styles['icon-info']} />
                  </Tooltip>
                </>
              }
              type="pureCard"
              trigger="blur"
              rules={[
                {
                  required: true,
                  message: t({
                    enUS: 'This field is required',
                  }),
                },
              ]}
            >
              <Form.Radio value={0}>0%</Form.Radio>
              <Form.Radio value={5}>5%</Form.Radio>
              <Form.Radio value={10}>10%</Form.Radio>
              <Form.Radio value={15}>15%</Form.Radio>
            </Form.RadioGroup>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.TextArea
              field="automatorDesc"
              label={t({
                enUS: 'Strategy Description',
              })}
              trigger="blur"
              rules={[
                {
                  required: true,
                  message: t({
                    enUS: 'This field is required',
                  }),
                },
              ]}
            />
          </Col>
        </Row>
      </Form>
      <AsyncButton
        className={classNames(
          'btn-gradient-text',
          'btn-primary',
          styles['btn-deploy'],
        )}
        onClick={() => deploy()}
      >
        {payload.factory && payload.factory.chainId != chainId
          ? t(
              {
                enUS: 'Switch to {{chainName}} to Deploy',
              },
              {
                chainName: ChainMap[payload.factory.chainId!]?.name,
              },
            )
          : t({
              enUS: 'Deploy Automator Vault',
            })}
      </AsyncButton>
      <div className={styles['tips']}>
        <p className={styles['tip']}>
          {t({
            enUS: 'Note: Automator information cannot be edited after vault created.',
          })}
        </p>
      </div>
    </div>
  );
};
const StepCreating = () => {
  const [t] = useTranslation('AutomatorCreate');
  const { payload } = useAutomatorCreateStore();
  return (
    <div className={styles['step-4-creating']}>
      <Spin indicator={<IconLoading />} />
      <div className={styles['title']}>
        {formatHighlightedText(
          t(
            {
              enUS: 'Automator [[{{name}}]] is Creating',
            },
            {
              name: payload.automatorName,
            },
          ),
          {
            hightlightedClassName: styles['hightlighted'],
          },
        )}
      </div>
      <div className={styles['desc']}>
        {t({
          enUS: 'Processing, Please Do Not Close This Page',
        })}
      </div>
    </div>
  );
};
const StepFinished = () => {
  const [t] = useTranslation('AutomatorCreate');
  const { automatorCreateResult, payload } = useAutomatorCreateStore();
  const handleCopy = useLazyCallback(() => {
    Promise.resolve()
      .then(() => copy(automatorCreateResult!))
      .then(() =>
        Toast.success(
          t({
            enUS: 'Copy successful',
            zhCN: '复制成功',
          }),
        ),
      );
  });
  return (
    <div className={styles['step-5-finished']}>
      <div className={styles['icon-congrats']} />
      <div className={styles['title']}>
        {formatHighlightedText(
          t(
            {
              enUS: 'Automator [[{{name}}]] is created!',
            },
            {
              name: payload.automatorName,
            },
          ),
          {
            hightlightedClassName: styles['hightlighted'],
          },
        )}
      </div>
      <div className={styles['desc']} onClick={handleCopy}>
        {automatorCreateResult}
      </div>
      <div />
      <Button
        className={classNames(
          'btn-gradient-text',
          'btn-primary',
          styles['btn-finish'],
        )}
      >
        {t({
          enUS: 'Go to Automator Management',
        })}
      </Button>
    </div>
  );
};

export const AutomatorCreateModel = (props: BaseInputProps<boolean>) => {
  const [t] = useTranslation('AutomatorCreate');
  const store = useAutomatorCreateStore();
  const { payload } = useAutomatorCreateStore();
  const isMobileUI = useIsMobileUI();
  const currentStep = useMemo(() => {
    for (const step of steps) {
      if (step.arrived(store)) {
        return {
          ...step,
          comp: step.comp(),
          arrived: undefined,
        };
      }
    }
    return { comp: undefined, step1: false, step2: false, processPercent: 0 };
  }, [store]);

  return (
    <Modal
      footer={null}
      width={660}
      visible={props.value}
      onCancel={() => props.onChange?.(false)}
      className={classNames(styles['automator-create-modal'], {
        [styles['mobile-ui']]: isMobileUI,
      })}
      title={
        <div className={styles['title']}>
          {t({
            enUS: 'Create Your Automator',
          })}
        </div>
      }
    >
      <div className={styles['model-content']}>
        <div className={classNames(styles['chain-and-ccy'])}>
          <div className={styles['chain']}>
            <span className={styles['label']}>
              {t({
                enUS: 'Automator Chain',
              })}
            </span>
            <span className={styles['value']}>
              <img
                className={styles['logo']}
                src={ChainMap[payload.factory?.chainId || 0]?.icon}
                alt=""
              />
              <span>{ChainMap[payload.factory?.chainId || 0]?.name}</span>
            </span>
          </div>
          <div className={styles['token']}>
            <span className={styles['label']}>
              {t({
                enUS: 'Deposit Token',
              })}
            </span>
            <span className={styles['value']}>
              <img
                className={styles['logo']}
                src={
                  CCYService.ccyConfigs[payload.factory?.clientDepositCcy || '']
                    ?.icon
                }
                alt=""
              />
              <span>
                {CCYService.ccyConfigs[payload.factory?.clientDepositCcy || '']
                  ?.name || payload.factory?.clientDepositCcy}
              </span>
            </span>
          </div>
        </div>
        <ol className={styles['steps']}>
          <li className={currentStep.step1 ? styles['done'] : undefined}>
            <span className={styles['step']}>
              {t({
                enUS: 'Step 1',
              })}
            </span>
            <span>
              {formatHighlightedText(
                t(
                  {
                    enUS: 'Burn {{amount}} RCH',
                  },
                  {
                    amount: AutomatorCreatorService.rchAmountForBurning,
                  },
                ),
                {
                  hightlightedClassName: styles['highlighted'],
                },
              )}
            </span>
          </li>
          <li className={currentStep.step2 ? styles['selected'] : undefined}>
            <span className={styles['step']}>
              {t({
                enUS: 'Step 2',
              })}
            </span>
            <span>
              {formatHighlightedText(
                t({
                  enUS: 'Deploy Automator Contract',
                }),
                {
                  hightlightedClassName: styles['highlighted'],
                },
              )}
            </span>
          </li>
        </ol>
        <Progress
          percent={currentStep.processPercent}
          size="large"
          stroke={'linear-gradient(96deg, #50d113 0.36%, #ffe500 100%)'}
          strokeGradient
          className={styles['progress']}
        />
        {currentStep.comp}
      </div>
    </Modal>
  );
};