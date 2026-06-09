import { useState, useCallback } from 'react';
import { leaveAPI } from '../services/api';

export const useLeave = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyLeave = useCallback(async (leaveData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveAPI.apply(leaveData);
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Failed to submit leave application';
      setError(errMsg);
      throw new Error(errMsg);
    }
  }, []);

  const getBalance = useCallback(async (year) => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveAPI.getBalance(year);
      setLoading(false);
      return res.data.balance || [];
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to load leave balances');
      return [];
    }
  }, []);

  const getMyLeaves = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveAPI.getMyLeaves(status);
      setLoading(false);
      return res.data.leaves || [];
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to retrieve leave history');
      return [];
    }
  }, []);

  return {
    loading,
    error,
    applyLeave,
    getBalance,
    getMyLeaves
  };
};

export default useLeave;
