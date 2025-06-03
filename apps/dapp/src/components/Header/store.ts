import { ReactNode } from 'react';
import { TFunction } from '@sofa/services/i18n';
import { createWithEqualityFn } from 'zustand/traditional';

export interface MenuItem {
  path: string;
  type?: 1 | 2;
  target?: string;
  icon?: ReactNode;
  children?: MenuItem[];

  label(t: TFunction): ReactNode;
  desc?(t: TFunction): ReactNode;
  group?(t: TFunction): string;

  hide?(): boolean;

  extraSearch?: string; // 不影响路径 match

  active?: boolean;
}

export interface MobileHeaderState {
  selectedMenuItem?: MenuItem;
  setSelectedMenuItem: (menuItem?: MenuItem) => void;
  headerHidden?: boolean;
  setHeaderHidden: (v?: boolean) => void;
}

export const useMobileHeaderState = createWithEqualityFn<MobileHeaderState>(
  (set) => ({
    setSelectedMenuItem(item) {
      set({ selectedMenuItem: item });
    },
    setHeaderHidden(v) {
      set({ headerHidden: v });
    },
  }),
);

export const setMobileHeaderHidden = (hidden: boolean) => {
  useMobileHeaderState.getState().setHeaderHidden(hidden);
};
