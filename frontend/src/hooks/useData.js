// frontend/src/hooks/useData.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function getQuarter(project) {
  if (project.fecha) {
    const date = new Date(project.fecha);
    if (!Number.isNaN(date.getTime())) {
      const month = date.getMonth() + 1;
      if (month <= 3) return 'Q1';
      if (month <= 6) return 'Q2';
      if (month <= 9) return 'Q3';
      return 'Q4';
    }
  }
  return 'Q1';
}

function buildSummary(projects) {
  const valid = projects.filter(
    (p) => (Number(p.tarifa) || 0) > 0 || (Number(p.total_prod) || 0) > 0
  );

  const totalTarifa = valid.reduce((sum, p) => sum + (Number(p.tarifa) || 0), 0);
  const totalProd = valid.reduce((sum, p) => sum + (Number(p.total_prod) || 0), 0);
  const totalMargenAbs = valid.reduce((sum, p) => sum + (Number(p.margen_abs) || 0), 0);
  const margenPct = totalTarifa > 0 ? (totalMargenAbs / totalTarifa) * 100 : 0;

  const byCliente = {};
  for (const p of valid) {
    const key = p.cliente || 'Sin cliente';
    if (!byCliente[key]) {
      byCliente[key] = {
        cliente: key,
        tarifa: 0,
        totalProd: 0,
        margen: 0,
        count: 0,
      };
    }
    byCliente[key].tarifa += Number(p.tarifa) || 0;
    byCliente[key].totalProd += Number(p.total_prod) || 0;
    byCliente[key].margen += Number(p.margen_abs) || 0;
    byCliente[key].count += 1;
  }

  const byCampaña = {};
  for (const p of valid) {
    const key = p.sheet || p.campaña || 'Sin campaña';
    if (!byCampaña[key]) {
      byCampaña[key] = {
        campaña: key,
        tarifa: 0,
        totalProd: 0,
        margen: 0,
        count: 0,
      };
    }
    byCampaña[key].tarifa += Number(p.tarifa) || 0;
    byCampaña[key].totalProd += Number(p.total_prod) || 0;
    byCampaña[key].margen += Number(p.margen_abs) || 0;
    byCampaña[key].count += 1;
  }

  const byAño = {};
  for (const p of valid) {
    const key = p.año || 'Sin año';
    if (!byAño[key]) {
      byAño[key] = {
        año: key,
        tarifa: 0,
        totalProd: 0,
        margen: 0,
        count: 0,
      };
    }
    byAño[key].tarifa += Number(p.tarifa) || 0;
    byAño[key].totalProd += Number(p.total_prod) || 0;
    byAño[key].margen += Number(p.margen_abs) || 0;
    byAño[key].count += 1;
  }

  const años = [...new Set(valid.map((p) => p.año).filter(Boolean))].sort((a, b) => a - b);

  const añoActual = años.length > 0 ? Math.max(...años) : new Date().getFullYear();
  const añoAnterior = añoActual - 1;

  const actual = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const anterior = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  for (const p of valid) {
    const quarter = getQuarter(p);
    if (p.año === añoActual) actual[quarter] += Number(p.tarifa) || 0;
    if (p.año === añoAnterior) anterior[quarter] += Number(p.tarifa) || 0;
  }

  return {
    totalProjects: valid.length,
    totalTarifa,
    totalProd,
    totalMargenAbs,
    margenPct: Math.round(margenPct * 10) / 10,
    años,
    byCliente: Object.values(byCliente).sort((a, b) => b.tarifa - a.tarifa),
    byCampaña: Object.values(byCampaña).sort((a, b) => b.tarifa - a.tarifa),
    byAño: Object.values(byAño).sort((a, b) => a.año - b.año),
    comparativoAnual: {
      añoActual,
      añoAnterior,
      actual,
      anterior,
    },
  };
}

export function useSummary(estado, refreshKey = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);

      let query = supabase
        .from('projects')
        .select('fecha,año,cliente,campaña,sheet,estado,tarifa,total_prod,margen_abs,deleted')
        .eq('deleted', false);

      if (estado) {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error cargando summary:', error);
        setData(null);
      } else {
        setData(buildSummary(data || []));
      }

      setLoading(false);
    }

    fetchSummary();
  }, [estado, refreshKey]);

  return { data, loading };
}

export function useProjects(filters = {}, refreshKey = 0) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);

      let query = supabase
        .from('projects')
        .select('*')
        .eq('deleted', false);

      if (filters.estado) query = query.eq('estado', filters.estado);
      if (filters.año) query = query.eq('año', filters.año);
      if (filters.cliente) query = query.ilike('cliente', `%${filters.cliente}%`);
      if (filters.sheet) query = query.eq('sheet', filters.sheet);
      if (filters.elemento) query = query.ilike('elemento', `%${filters.elemento}%`);

      const { data, error } = await query;

      if (error) {
        console.error('Error cargando proyectos:', error);
        setData([]);
      } else {
        setData(data || []);
      }

      setLoading(false);
    }

    fetchProjects();
  }, [
    filters.estado,
    filters.año,
    filters.cliente,
    filters.sheet,
    filters.elemento,
    refreshKey,
  ]);

  return { data, loading };
}

export function useCampaigns(refreshKey = 0) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from('projects')
        .select('sheet, deleted')
        .eq('deleted', false);

      if (error) {
        console.error('Error cargando campañas:', error);
        setData([]);
        return;
      }

      const campaigns = [...new Set((data || []).map((p) => p.sheet).filter(Boolean))].sort();
      setData(campaigns);
    }

    fetchCampaigns();
  }, [refreshKey]);

  return data;
}