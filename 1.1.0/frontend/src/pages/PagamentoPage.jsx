// /src/pages/PagamentoPage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { formatarValorBR } from '../utils/currencyUtils';

// --- MUI ---
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';

function PagamentoPage() {
  const { pagamentoId } = useParams();
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(null); // 'pix' | 'boleto' | null
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchPagamento = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/pagamentos/${pagamentoId}`);
        setPagamento(res.data);
      } catch (err) {
        console.error('[PagamentoPage] Erro ao buscar dados do pagamento:', err);
        setError(err.response?.data?.msg || 'Erro ao carregar dados do pagamento.');
      } finally {
        setLoading(false);
      }
    };
    fetchPagamento();
  }, [pagamentoId]);

  const pixText = useMemo(() => pagamento?.pix?.qrCodeText || null, [pagamento]);
  const boletoLine = useMemo(() => pagamento?.boleto?.linhaDigitavel || null, [pagamento]);

  useEffect(() => {
    // Seleciona automaticamente a primeira aba disponível
    if (pixText && !boletoLine) setTab(0);
    if (!pixText && boletoLine) setTab(0);
  }, [pixText, boletoLine]);

  const handleCopy = async (kind) => {
    try {
      const text = kind === 'pix' ? pixText : boletoLine;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiado(kind);
      setTimeout(() => setCopiado(null), 2000);
    } catch (err) {
      console.error('[PagamentoPage] Falha ao copiar:', err);
      setError('Não foi possível copiar o código.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 5, py: 5 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando pagamento...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!pagamento) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert severity="warning">Pagamento não encontrado.</Alert>
      </Container>
    );
  }

  const provider = pagamento?.metodoPagamento?.provider || '—';
  const metodoNome = pagamento?.metodoPagamento?.nome || 'Método de pagamento';

  const hasPix = Boolean(pixText);
  const hasBoleto = Boolean(boletoLine);

  const tabs = [
    ...(hasPix ? [{ label: 'PIX', kind: 'pix' }] : []),
    ...(hasBoleto ? [{ label: 'Boleto', kind: 'boleto' }] : []),
  ];

  const activeKind = tabs[tab]?.kind || (hasPix ? 'pix' : 'boleto');

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: { xs: 2, sm: 4 }, mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {pagamento.status === 'pendente' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom align="center">
              Pague sua Taxa de Filiação
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
              <Chip label={metodoNome} variant="outlined" />
              <Chip label={`Provider: ${provider}`} color={provider === 'cora' ? 'success' : 'default'} variant="outlined" />
            </Box>

            <Typography variant="body1" align="center" sx={{ mb: 2 }}>
              Valor: <strong>{formatarValorBR(pagamento.valor)}</strong>
            </Typography>

            {!hasPix && !hasBoleto && (
              <Alert severity="warning" sx={{ width: '100%' }}>
                Este pagamento ainda não possui dados de PIX/Boleto disponíveis. Tente novamente em alguns instantes.
              </Alert>
            )}

            {(hasPix || hasBoleto) && (
              <Box sx={{ width: '100%' }}>
                {tabs.length > 1 && (
                  <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
                    {tabs.map((t) => (
                      <Tab key={t.kind} label={t.label} />
                    ))}
                  </Tabs>
                )}

                {/* --- PIX --- */}
                {activeKind === 'pix' && hasPix && (
                  <>
                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                      Pagamento via PIX
                    </Typography>

                    <Box sx={{ my: 2, border: '1px solid #ddd', p: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                      <QRCodeSVG value={pixText} size={256} includeMargin />
                    </Box>

                    <Typography variant="caption" color="text.secondary" align="center" sx={{ mb: 2, display: 'block' }}>
                      Abra o app do seu banco e escaneie o QR Code.
                    </Typography>

                    <Divider sx={{ width: '100%', my: 2 }}>OU</Divider>

                    <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                      Copie o código abaixo e cole no seu app (PIX Copia e Cola):
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={pixText}
                      sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton onClick={() => handleCopy('pix')} title="Copiar PIX">
                            <ContentCopyIcon />
                          </IconButton>
                        )
                      }}
                    />

                    {copiado === 'pix' && (
                      <Typography color="success.main" variant="caption">
                        PIX copiado para a área de transferência!
                      </Typography>
                    )}
                  </>
                )}

                {/* --- BOLETO --- */}
                {activeKind === 'boleto' && hasBoleto && (
                  <>
                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                      Pagamento via Boleto
                    </Typography>

                    <Alert severity="info" sx={{ mb: 2 }}>
                      Você pode pagar o boleto pelo app do seu banco usando a linha digitável abaixo.
                    </Alert>

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={boletoLine}
                      sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton onClick={() => handleCopy('boleto')} title="Copiar linha digitável">
                            <ContentCopyIcon />
                          </IconButton>
                        )
                      }}
                    />

                    {copiado === 'boleto' && (
                      <Typography color="success.main" variant="caption">
                        Linha digitável copiada!
                      </Typography>
                    )}
                  </>
                )}

                <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
                  Após o pagamento, o status da sua filiação será atualizado para <strong>"Ativo"</strong> automaticamente.
                  Isso pode levar alguns minutos.
                </Alert>
              </Box>
            )}
          </>
        ) : (
          <Alert severity={pagamento.status === 'pago' ? 'success' : 'error'} sx={{ width: '100%' }}>
            {pagamento.status === 'pago'
              ? `Este pagamento (ID: ${pagamento.pagamentoId}) já foi concluído com sucesso.`
              : `Este pagamento (ID: ${pagamento.pagamentoId}) está com status: ${String(pagamento.status).toUpperCase()}`}
          </Alert>
        )}

      </Paper>
    </Container>
  );
}

export default PagamentoPage;
