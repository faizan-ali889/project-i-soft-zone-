import { useState, useCallback } from 'react';
import { employeeAPI } from '../services/api';

export const useEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeAPI.getAll();
      setLoading(false);
      return res.data || [];
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to fetch employees list');
      return [];
    }
  }, []);

  const fetchEmployeeById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeAPI.getById(id);
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to fetch employee details');
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    fetchEmployees,
    fetchEmployeeById
  };
};

export default useEmployee;
