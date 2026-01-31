
import { CompanyInfo, CashMemo } from '../types';

const KEYS = {
  COMPANY: 'promemo_company_v1',
  MEMOS: 'promemo_memos_v1'
};

export const storageService = {
  getCompany: (): CompanyInfo | null => {
    const data = localStorage.getItem(KEYS.COMPANY);
    return data ? JSON.parse(data) : null;
  },
  saveCompany: (info: CompanyInfo) => {
    localStorage.setItem(KEYS.COMPANY, JSON.stringify(info));
  },
  getMemos: (): CashMemo[] => {
    const data = localStorage.getItem(KEYS.MEMOS);
    return data ? JSON.parse(data) : [];
  },
  saveMemo: (memo: CashMemo) => {
    const memos = storageService.getMemos();
    const existingIndex = memos.findIndex(m => m.id === memo.id);
    if (existingIndex > -1) {
      memos[existingIndex] = memo;
    } else {
      memos.unshift(memo);
    }
    localStorage.setItem(KEYS.MEMOS, JSON.stringify(memos));
  },
  deleteMemo: (id: string) => {
    const memos = storageService.getMemos();
    const filtered = memos.filter(m => m.id !== id);
    localStorage.setItem(KEYS.MEMOS, JSON.stringify(filtered));
  }
};
