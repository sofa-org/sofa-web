// import { Fragment, ReactNode, useState } from 'react';
// import { Collapse, Modal } from '@douyinfe/semi-ui';
// import { TFunction, useTranslation } from '@sofa/services/i18n';
// import { displayPercentage } from '@sofa/utils/amount';
// import { isLegalNum } from '@sofa/utils/fns';
// import { simplePlus } from '@sofa/utils/object';
// import classNames from 'classnames';

// import { addI18nResources } from '@/locales';
// import { useGlobalState } from '@/store';

// import { useWalletStore } from '../WalletConnector/store';

// import locale from './locale';

// import styles from './index.module.scss';

// addI18nResources(locale, 'ApyDesc');

// export interface ApyDescProps {
//   ccy: string;
//   protectedApy?: number;
//   enhancedApy?: number;
//   rchApy?: number;
//   children?: ReactNode;
// }

// const items = [
//   { label: (t: TFunction) => t('protected.apy'), key: 'protectedApy' },
//   { label: (t: TFunction) => t('rch.apy'), key: 'rchApy' },
//   { label: (t: TFunction) => t('upside.apy'), key: 'enhancedApy' },
// ] as const;

// const ApyDesc = (props: ApyDescProps) => {
//   const [visible, setVisible] = useState(false);
//   const wallet = useWalletStore();
//   const interestRate = useGlobalState(
//     (state) => state.interestRate[wallet.chainId]?.[props.ccy],
//   );

//   const [t] = useTranslation('ApyDesc');
//   const total = simplePlus(props.protectedApy, props.enhancedApy, props.rchApy);
//   const renderDesc = (desc: string) =>
//     desc.split(/\n/).map((it) => (
//       <Fragment key={it}>
//         {it}
//         <br />
//       </Fragment>
//     ));
//   return (
//     <div onClick={(e) => e.stopPropagation()}>
//       <Modal
//         centered
//         title={t('title')}
//         width={Math.min(
//           720 / window.winScale,
//           window.innerWidth - 24 / window.winScale,
//         )}
//         visible={visible}
//         onCancel={() => setVisible(false)}
//         footer={null}
//       >
//         <div className={styles['total']}>
//           <span className={styles['label']}>{t('title')}</span>
//           <span className={styles['value']}>{displayPercentage(total)}</span>
//         </div>
//         {items.map((it) =>
//           isLegalNum(props[it.key]) ? (
//             <div className={styles['item']} key={it.key}>
//               <span className={styles['label']}>{it.label(t)}</span>
//               <span className={styles['value']}>
//                 {displayPercentage(props[it.key])}
//               </span>
//             </div>
//           ) : (
//             <Fragment key={it.key} />
//           ),
//         )}
//         <Collapse className={styles['collapse']}>
//           <Collapse.Panel
//             className={styles['collapse-item']}
//             header={t('apy.desc.title')}
//             itemKey="1"
//           >
//             <p>{renderDesc(t('apy.desc'))}</p>
//             <h5>{t('apy.interest.title')}</h5>
//             <div className={styles['table']}>
//               <div className={styles['th']}>{t('current')}</div>
//               <div className={styles['th']}>{t('monthly.average')}</div>
//               <div className={styles['td']}>
//                 {displayPercentage(interestRate?.current)}
//               </div>
//               <div className={styles['td']}>
//                 {displayPercentage(interestRate?.avgWeekly)}
//               </div>
//             </div>
//             <p>
//               {renderDesc(
//                 t('apy.desc.notice', {
//                   protectedApy: displayPercentage(props.protectedApy),
//                   interestRate: displayPercentage(interestRate?.avgWeekly),
//                 }),
//               )}
//             </p>
//           </Collapse.Panel>
//           <Collapse.Panel
//             className={styles['collapse-item']}
//             header={t('apy.rch.desc.title')}
//             itemKey="2"
//           >
//             <p>{renderDesc(t('apy.rch.desc'))}</p>
//           </Collapse.Panel>
//         </Collapse>
//       </Modal>
//       <div
//         className={classNames(styles['apy-desc'], 'apy-desc')}
//         onClickCapture={() => setVisible(true)}
//       >
//         {props.children}
//       </div>
//     </div>
//   );
// };

// export default ApyDesc;
