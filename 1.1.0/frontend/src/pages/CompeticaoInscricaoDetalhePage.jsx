import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  TextField,
  MenuItem,
} from '@mui/material';

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CompeticaoInscricaoDetalhePage() {
  const { inscricaoId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [peso, setPeso] = useState('');
  const [categoria, setCategoria] = useState('COLORIDAS');

  const fetchOne = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/competicoes/inscricoes/${inscricaoId}`);
      setData(res.data);
      setPeso(res.data?.peso_kg ?? '');
      setCategoria(res.data?.categoria_combate ?? 'COLORIDAS');
    } catch (err) {
      console.error('[CompeticaoInscricaoDetalhePage] erro:', err);
      setError(err.response?.data?.msg || 'Erro ao carregar inscrição.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscricaoId]);

  const salvar = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        peso_kg: peso !== '' ? Number(peso) : undefined,
        categoria_combate: categoria,
      };
      const res = await axios.put(`/api/competicoes/inscricoes/${inscricaoId}`, payload);
      setData(res.data);
    } catch (err) {
      console.error('[CompeticaoInscricaoDetalhePage] erro salvar:', err);
      setError(err.response?.data?.msg || 'Erro ao atualizar inscrição.');
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async () => {
    try {
      setSaving(true);
      setError(null);
      await axios.delete(`/api/competicoes/inscricoes/${inscricaoId}`);
      navigate('/competicoes/minhas-inscricoes');
    } catch (err) {
      console.error('[CompeticaoInscricaoDetalhePage] erro cancelar:', err);
      setError(err.response?.data?.msg || 'Erro ao cancelar inscrição.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress />
        <Typography>Carregando inscrição...</Typography>
      </Box>
    );
  }

  if (!data) {
    return <Alert severity="error">Inscrição não encontrada.</Alert>;
  }

  const item = (data.pagamentoItens || [])[0];
  const pagamento = item?.pagamento || null;

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Detalhe da Inscrição</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            {data.evento?.nome || 'Evento'} — {data.competicaoModalidade?.nome || 'Submodalidade'}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Status: <strong>{data.status}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Divisão: <strong>{data.divisao_peso_label || data.divisao_peso}</strong>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Editar dados</Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              type="number"
              inputProps={{ step: '0.1' }}
              sx={{ minWidth: 180 }}
            />

            <TextField
              label="Categoria"
              select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="COLORIDAS">Faixas Coloridas</MenuItem>
              <MenuItem value="AVANCADA">Avançada</MenuItem>
            </TextField>
          </Box>

          {pagamento && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Pagamento</Typography>
              <Typography variant="body2" color="text.secondary">
                Pagamento #{pagamento.id} • Status: <strong>{pagamento.status}</strong> • Total: <strong>{money(pagamento.valor_total)}</strong>
              </Typography>
            </>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => navigate('/competicoes/minhas-inscricoes')}>Voltar</Button>
          <Button variant="contained" onClick={salvar} disabled={saving}>Salvar</Button>
          <Button color="error" variant="outlined" onClick={cancelar} disabled={saving}>Cancelar inscrição</Button>
          {pagamento?.id ? (
            <Button variant="outlined" onClick={() => navigate(`/pagamento/${pagamento.id}`)}>
              Ver pagamento
            </Button>
          ) : null}
        </CardActions>
      </Card>

      <Alert severity="info" sx={{ mt: 2 }}>
        A edição/cancelamento só é permitida enquanto a inscrição estiver <strong>PENDENTE_PAGAMENTO</strong> (ou aguardando autorização, no caso de autorização especial).
      </Alert>
    </Box>
  );
}
