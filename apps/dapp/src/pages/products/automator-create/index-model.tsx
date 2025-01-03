import { useMemo } from 'react';
import {
  Button,
  Col,
  Form,
  Modal,
  Progress,
  Row,
  Spin,
  Toast,
} from '@douyinfe/semi-ui';
import { automatorCreateConfigs } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { RCHService } from '@sofa/services/rch';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';

import AsyncButton from '@/components/AsyncButton';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useWalletStore } from '@/components/WalletConnector/store';

import { Comp as IconLoading } from './assets/icon-loading.svg';
import {
  AutomatorCreateStoreType,
  getNameForChain,
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
    arrived: (store) => !!store.info,
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
  const burn = useLazyCallback(async () => {
    try {
      if (chainId != automatorCreateConfigs.burnRchChainId) {
        // switch chain
        await useWalletStore.setChain(automatorCreateConfigs.burnRchChainId);
      }
      useAutomatorCreateStore.setState({
        rchBurning: true,
      });
      // burn
      const hash = await RCHService.burn(
        automatorCreateConfigs.burnRchChainId,
        automatorCreateConfigs.burnRchAmount,
      );

      useAutomatorCreateStore.setState({
        rchBurned: true,
        payload: {
          ...useAutomatorCreateStore.getState().payload,
          burnTransactionHash: hash,
        },
      });
    } catch (e) {
      useAutomatorCreateStore.getState().reset();
      console.error('error burn rch for automator creation', e);
      Toast.error(getErrorMsg(e));
    }
  });
  return (
    <div className={styles['step-1-start']}>
      <div className={styles['rch-amount']}>
        <span className={styles['amount']}>
          {automatorCreateConfigs.burnRchAmount}
        </span>{' '}
        RCH
      </div>
      <AsyncButton
        className={classNames(styles['confirm-btn'], 'btn-primary')}
        onClick={() => burn()}
      >
        {chainId == automatorCreateConfigs.burnRchChainId
          ? t({
              enUS: 'Confirm to Burn',
            })
          : t(
              {
                enUS: 'Switch to {{chainName}} to Burn',
              },
              {
                chainName: getNameForChain(
                  automatorCreateConfigs.burnRchChainId,
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
  const [t] = useTranslation('AutomatorCreate');
  const { payload } = useAutomatorCreateStore();
  const { chainId } = useWalletStore();
  return (
    <div className={styles['step-3-form']}>
      <Form labelPosition="top" initValues={payload}>
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
              label={t({
                enUS: 'Share Precent',
              })}
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
      <Button className="btn-gradient-text">
        {payload.chainId != chainId
          ? t(
              {
                enUS: 'Switch to {{chainName}} to Deploy',
              },
              {
                chainName: ChainMap[payload.chainId!]?.name,
              },
            )
          : t({
              enUS: 'Deploy Automator Vault',
            })}
      </Button>
    </div>
  );
};
const StepCreating = () => {
  const [t] = useTranslation('AutomatorCreate');
  const { payload } = useAutomatorCreateStore();
  return (
    <div className={styles['step-4-creating']}>
      <Spin />
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
  const { info } = useAutomatorCreateStore();
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
              name: info?.automatorName,
            },
          ),
          {
            hightlightedClassName: styles['hightlighted'],
          },
        )}
      </div>
      <div className={styles['desc']}>{info?.automatorVault}</div>
      <Button>
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
                src={ChainMap[payload.chainId!]?.icon}
                alt=""
              />
              <span>{ChainMap[payload.chainId!]?.name}</span>
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
                src={CCYService.ccyConfigs[payload.clientDepositCcy!]?.icon}
                alt=""
              />
              <span>
                {CCYService.ccyConfigs[payload.clientDepositCcy!]?.name ||
                  payload.clientDepositCcy}
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
                    amount: automatorCreateConfigs.burnRchAmount,
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
