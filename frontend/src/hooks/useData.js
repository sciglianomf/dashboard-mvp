// frontend/src/hooks/useData.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useSummary(estado, refreshKey = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/summary', { params: { estado } })
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [estado, refreshKey]);

  return { data, loading };
}

export function useProjects(filters = {}, refreshKey = 0) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.año) params.año = filters.año;
    if (filters.cliente) params.cliente = filters.cliente;
    if (filters.sheet) params.sheet = filters.sheet;
    if (filters.elemento) params.elemento = filters.elemento;

    api.get('/api/projects', { params })
      .then(res => setData(res.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters.año, filters.cliente, filters.sheet, filters.elemento, refreshKey]);

  return { data, loading };
}

export function useCampaigns(refreshKey = 0) {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get('/api/campaigns').then(res => setData(res.data.data)).catch(() => {});
  }, [refreshKey]);
  return data;
}
