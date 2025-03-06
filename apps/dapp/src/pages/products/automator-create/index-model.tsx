import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { isMockEnabled } from '@sofa/services/mock';
import { displayPercentage } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { pollingUntil } from '@sofa/utils/http';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import { copy } from 'clipboard';

import AsyncButton from '@/components/AsyncButton';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorCreatorStore } from '../automator-mine/store';

import { Comp as IconInfo } from './assets/icon-info.svg';
import { Comp as IconLoading } from './assets/icon-loading.svg';
import {
  AutomatorCreateStoreType,
  getNameForChain,
  useAutomatorCreateStore,
} from './store';
import { AutomatorRiskExposures } from './util';

import styles from './index-model.module.scss';

const steps: {
  arrived: (store: AutomatorCreateStoreType) => boolean;
  processPercent: number;
  step1?: boolean;
  step2?: boolean;
  comp: () => JSX.Element[] | JSX.Element;
}[] = [
  {
    arrived: (store) => !!store.automatorDetail,
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
    arrived: (store) => store.rchCredits == 'has_credits',
    processPercent: 50,
    step1: true,
    comp: () => <StepForm />,
  },
  {
    arrived: (store) =>
      store.rchBurn == 'burning' || store.rchCredits == 'waiting',
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
  const { chainId, address } = useWalletStore();
  const { payload } = useAutomatorCreateStore();
  const burn = useLazyCallback(async () => {
    const factory = payload.factory;
    if (!factory) {
      return;
    }
    try {
      useAutomatorCreateStore.setState({
        rchBurn: 'burning',
      });
      // burn
      if (!Env.isProd && /test-fail-at=[^&]*\bburn\b/.test(location.search)) {
        throw new Error('Test Burn Fail');
      }
      const hash = await AutomatorCreatorService.burnRCHBeforeCreate(
        () => {},
        factory,
      );
      useAutomatorCreateStore.setState({
        rchBurn: 'burned',
        rchCredits: 'waiting',
      });
      if (
        !Env.isProd &&
        /test-fail-at=[^&]*\bwait-credit\b/.test(location.search)
      ) {
        throw new Error('Test WaitCredit Fail');
      }
      await AutomatorCreatorService.awaitingForCreateCredits(() => {}, factory);

      useAutomatorCreateStore.setState({
        rchCredits: 'has_credits',
        payload: {
          ...useAutomatorCreateStore.getState().payload,
          burnTransactionHash: hash,
        },
      });
    } catch (e) {
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
          ? t({ enUS: 'Confirm to Burn', zhCN: '确认销毁' })
          : t(
              {
                enUS: 'Switch to {{chainName}} to Burn',
                zhCN: '切换到{{chainName}}进行销毁',
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
          zhCN: '处理中，请勿关闭此页面',
        })}
      </div>
    </div>
  );
};
const StepForm = () => {
  const api = useRef<FormApi>();
  const [t] = useTranslation('AutomatorCreate');
  const { payload, updatePayload } = useAutomatorCreateStore();
  const { address, chainId } = useWalletStore();
  const isMobileUI = useIsMobileUI();
  const deploy = useLazyCallback(async () => {
    const values = (await api.current
      ?.validate()
      .catch((r) => undefined)) as unknown as AutomatorCreateParams | undefined;
    if (!values) {
      return;
    }
    updatePayload(values);

    const _payload = {
      ...payload,
      ...values,
    };
    const factory = _payload.factory;
    if (!_payload || !factory || !address) {
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
      if (!Env.isProd && /test-fail-at=[^&]*\bcreate\b/.test(location.search)) {
        throw new Error('Test Create Fail');
      }
      let automatorAddress =
        useAutomatorCreateStore.getState().automatorAddress;
      if (!automatorAddress) {
        automatorAddress =
          await AutomatorCreatorService.createAutomatorContract(() => {}, {
            ..._payload,
            creator: address,
          } as AutomatorCreateParams);

        useAutomatorCreateStore.setState({
          automatorAddress,
        });
      }
      if (
        !Env.isProd &&
        /test-fail-at=[^&]*\bregister-to-server\b/.test(location.search)
      ) {
        throw new Error('Test RegisterToServer Fail');
      }
      await AutomatorCreatorService.registerAutomator({
        ..._payload,
        creator: address,
        automatorAddress,
      });
      // polling server, until we see the automator in the /list
      const automatorReturnedByServer = await pollingUntil(
        async () => {
          return AutomatorCreatorService.automatorList({
            chainId,
            wallet: address,
          })
            .then((res) =>
              res.find(
                (a) =>
                  a.vaultInfo.depositCcy == factory.clientDepositCcy &&
                  a.vaultInfo.creator.toLowerCase() == address.toLowerCase() &&
                  a.vaultInfo.chainId == chainId,
              ),
            )
            .catch(() => undefined);
        },
        (automatorReturnedByServer, count) =>
          !!automatorReturnedByServer || count > 5 * 60,
        1000,
      );
      if (!automatorReturnedByServer[automatorReturnedByServer.length - 1]) {
        throw new Error(
          `Timeout awaiting automator creation complete: ${automatorAddress}`,
        );
      }
      useAutomatorCreateStore.setState({
        automatorCreating: false,
        automatorDetail:
          automatorReturnedByServer[automatorReturnedByServer.length - 1],
      });
    } catch (e) {
      console.error(e);
      Toast.error(getErrorMsg(e));
      useAutomatorCreateStore.setState({
        automatorCreating: false,
      });
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
              label={t({ enUS: 'Automator Name', zhCN: 'Automator名称' })}
              trigger="blur"
              rules={[
                {
                  required: true,
                  message: t({
                    enUS: 'This field is required',
                    zhCN: '此字段为必填项',
                  }),
                },
              ]}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Select
              field="redemptionPeriodDay"
              label={
                <>
                  {t({ enUS: 'Redemption Waiting Period', zhCN: '赎回等待期' })}
                  <Tooltip
                    style={{
                      maxWidth: isMobileUI ? '80vw' : '500px',
                    }}
                    content={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: t({
                            enUS: 'The Redemption Waiting Period refers to the time users must wait after submitting a redemption request for their funds to become claimable. Additionally, this period determines the maximum expiration date range for options tradable by the Automator manager.',
                            zhCN: '赎回等待期指用户提交赎回请求后，需等待的时间才能认领其资金。此外，该期限还规定了由Automator经理交易的期权的最大到期日期范围。',
                          }).replace(/\n/g, '<br />'),
                        }}
                      />
                    }
                  >
                    <IconInfo className={styles['icon-info']} />
                  </Tooltip>
                  <div className={styles['field-desc']}>
                    {t({
                      enUS: 'Note: You can only execute underlying products with expiry dates shorter or equal to the redemption period.',
                      zhCN: '注意：您只能交易到期日期在选择的等待期内的产品。',
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
                    zhCN: '此字段为必填项',
                  }),
                },
              ]}
            >
              {AutomatorCreatorService.redemptionPeriodDayValues.map((day) => (
                <Form.Select.Option value={day}>{day}D</Form.Select.Option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.RadioGroup
              field="feeRate"
              label={
                <>
                  {t({ enUS: 'Profit Share %', zhCN: '利润分成百分比' })}
                  <Tooltip
                    style={{
                      maxWidth: isMobileUI ? '80vw' : '500px',
                    }}
                    content={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: t({
                            enUS: 'The Profits Share Ratio defines the percentage of user profits that the Automator manager can share as their performance fee. If the Automator generates losses, the shared profits are recorded as negative until the account balance turns positive again. Only then can the manager resume withdrawing profit shares.',
                            zhCN: '利润分成比例定义了Automator经理可共享的用户利润百分比，作为其绩效费用。如果Automator产生亏损，共享利润记录为负，直到账户余额再次变为正数，此时经理才可继续提取利润分成。',
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
                    zhCN: '此字段为必填项',
                  }),
                },
              ]}
            >
              <Form.Radio value={'0'}>0%</Form.Radio>
              <Form.Radio value={'0.05'}>5%</Form.Radio>
              <Form.Radio value={'0.10'}>10%</Form.Radio>
              <Form.Radio value={'0.15'}>15%</Form.Radio>
            </Form.RadioGroup>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Select
              field="riskLevel"
              label={
                <>
                  {t({
                    enUS: 'Automator Risk Level',
                    zhCN: 'Automator风险级别',
                  })}
                  <div className={styles['field-desc']}>
                    {t({
                      enUS: 'The maximum percentage of your Automator capital you can lose.',
                      zhCN: '您Automator资本的最大可损失百分比。',
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
                    zhCN: '此字段为必填项',
                  }),
                },
              ]}
            >
              {AutomatorRiskExposures.map((it) => (
                <Form.Select.Option value={it.label} key={it.value}>
                  【{it.label} - {it.desc(t)}】
                  {t({ enUS: 'Max Risk Exposure', zhCN: '最大风险敞口' })}:{' '}
                  {displayPercentage(it.value)}
                </Form.Select.Option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.TextArea
              field="description"
              label={t({
                enUS: 'Strategy Description (Optional)',
                zhCN: '策略描述 (可选)',
              })}
              trigger="blur"
              rules={[]}
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
                zhCN: '切换到{{chainName}}进行部署',
              },
              {
                chainName: ChainMap[payload.factory.chainId!]?.name,
              },
            )
          : t({ enUS: 'Deploy Automator Vault', zhCN: '部署Automator金库' })}
      </AsyncButton>
      <div className={styles['tips']}>
        <p className={styles['tip']}>
          {t({
            enUS: 'Note: Automator vault information cannot be modified after creation.',
            zhCN: '注意：创建金库后，Automator信息不可编辑。',
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
              zhCN: 'Automator [[{{name}}]]正在创建',
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
          zhCN: '处理中，请勿关闭此页面',
        })}
      </div>
    </div>
  );
};
const StepFinished = () => {
  const [t] = useTranslation('AutomatorCreate');
  const navigate = useNavigate();
  const { automatorAddress, payload } = useAutomatorCreateStore();
  const handleCopy = useLazyCallback(() => {
    Promise.resolve()
      .then(() => copy(automatorAddress!))
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
              zhCN: 'Automator [[{{name}}]]已创建！',
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
        {automatorAddress}
      </div>
      <div />
      <Button
        onClick={() =>
          navigate(
            `/products/automator/operate?automator-vault=${
              automatorAddress || ''
            }`,
          )
        }
        className={classNames(
          'btn-gradient-text',
          'btn-primary',
          styles['btn-finish'],
        )}
      >
        {t({ enUS: 'Go to Automator Management', zhCN: '前往 Automator 管理' })}
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
      centered
      visible={props.value}
      onCancel={() => props.onChange?.(false)}
      className={classNames(styles['automator-create-modal'], {
        [styles['mobile-ui']]: isMobileUI,
      })}
      title={
        <div className={styles['title']}>
          {t({ enUS: 'Create Your Automator', zhCN: '创建Automator' })}
        </div>
      }
    >
      <div className={styles['model-content']}>
        <div className={classNames(styles['chain-and-ccy'])}>
          <div className={styles['chain']}>
            <span className={styles['label']}>
              {t({ enUS: 'Automator Chain', zhCN: 'Automator链' })}
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
              {t({ enUS: 'Deposit Token', zhCN: '存入代币' })}
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
              {t({ enUS: 'Step 1', zhCN: '步骤1' })}
            </span>
            <span>
              {formatHighlightedText(
                t(
                  { enUS: 'Burn {{amount}} RCH', zhCN: '燃烧{{amount}} RCH' },
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
          <li className={currentStep.step2 ? styles['done'] : undefined}>
            <span className={styles['step']}>
              {t({ enUS: 'Step 2', zhCN: '步骤2' })}
            </span>
            <span>
              {formatHighlightedText(
                t({
                  enUS: 'Deploy Automator Contract',
                  zhCN: '部署Automator合约',
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
          stroke={'linear-gradient(96deg, #44C476 0.36%, #ffe500 100%)'}
          strokeGradient
          className={styles['progress']}
        />
        {currentStep.comp}
      </div>
    </Modal>
  );
};
