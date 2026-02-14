import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Alert,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SearchIcon from '@mui/icons-material/Search';

import { useAuth } from '../context/AuthContext'; // ajuste se necessário

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Suporta:
// - novo: "documentos/3/arquivo.pdf"  -> /api/uploads/documentos/3/arquivo.pdf
// - legado: "arquivo.pdf" -> /api/uploads/documentos/3/arquivo.pdf (fallback)
function buildUploadUrl(storedPath, atletaId) {
  if (!storedPath) return '';
  const normalized = String(storedPath).replaceAll('\\', '/');

  if (normalized.includes('/')) {
    return encodeURI(`/api/uploads/${normalized}`);
  }

  // legado: apenas filename
  if (!atletaId) return encodeURI(`/api/uploads/${normalized}`); // fallback final
  return encodeURI(`/api/uploads/documentos/${atletaId}/${normalized}`);
}

function statusChip(status) {
  const s = status || 'pendente';
  const color =
    s === 'aprovado' ? 'success'
      : s === 'rejeitado' ? 'error'
        : String(s).includes('pendente') ? 'warning'
          : 'default';

  return <Chip size="small" label={s} color={color} variant="outlined" />;
}

function getExt(filename) {
  if (!filename) return '';
  const n = String(filename).toLowerCase();
  const idx = n.lastIndexOf('.');
  return idx >= 0 ? n.slice(idx + 1) : '';
}

function docKindByExt(ext) {
  if (!ext) return 'file';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  return 'file';
}

function sortDocs(a, b) {
  const order = (s) => {
    const st = (s || 'pendente').toLowerCase();
    if (st.includes('pendente')) return 0;
    if (st === 'rejeitado') return 1;
    if (st === 'aprovado') return 2;
    return 3;
  };

  const oa = order(a.status);
  const ob = order(b.status);
  if (oa !== ob) return oa - ob;

  const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return db - da; // mais recente primeiro
}

export default function AprovacaoDetalhePage() {
  const { filiacaoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const [filiacao, setFiliacao] = React.useState(null);

  // filtros
  const [filterStatus, setFilterStatus] = React.useState('all'); // all|pendente|aprovado|rejeitado
  const [search, setSearch] = React.useState('');

  // Preview modal
  const [openPreview, setOpenPreview] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState(null);

  const isAdmin = user?.tipo === 'admin';
  const isProfessor = user?.tipo === 'professor' || user?.tipo === 'treinador';

  // ✅ Professor só visualiza documentos
  const canReviewDocs = isAdmin;                    // aprovar/rejeitar docs + finalizar docs
  const canReviewVinculo = isAdmin || isProfessor;  // aprovar/rejeitar vínculo

  const fetchFiliacao = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/filiacoes/${filiacaoId}`, { headers: authHeaders() });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao carregar filiação (${res.status})`);
      }
      const data = await res.json();
      setFiliacao(data);
    } catch (e) {
      setError(e.message || 'Erro ao carregar filiação.');
    } finally {
      setLoading(false);
    }
  }, [filiacaoId]);

  React.useEffect(() => {
    fetchFiliacao();
  }, [fetchFiliacao]);

  const atletaId = filiacao?.atleta?.id || filiacao?.atleta_id || null;
  const fotoSrc = buildUploadUrl(filiacao?.atleta?.foto_url, atletaId);

  const documentosRaw = Array.isArray(filiacao?.documentos) ? filiacao.documentos : [];
  const vinculoDisponivel = filiacao?.status === 'pendente_aprovacao_professor';

  const docsEnhanced = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return documentosRaw
      .map((doc) => {
        const name = doc.nome_original || doc.url_arquivo || 'Arquivo';
        const ext = getExt(name);
        const kind = docKindByExt(ext);
        const url = buildUploadUrl(doc.url_arquivo, atletaId);
        const status = (doc.status || 'pendente').toLowerCase();

        return { ...doc, name, ext, kind, url, status };
      })
      .filter((doc) => {
        if (filterStatus !== 'all') {
          if (filterStatus === 'pendente' && !doc.status.includes('pendente')) return false;
          if (filterStatus === 'aprovado' && doc.status !== 'aprovado') return false;
          if (filterStatus === 'rejeitado' && doc.status !== 'rejeitado') return false;
        }
        if (!q) return true;
        return (
          String(doc.tipo_documento || '').toLowerCase().includes(q) ||
          String(doc.name || '').toLowerCase().includes(q)
        );
      })
      .sort(sortDocs);
  }, [documentosRaw, atletaId, filterStatus, search]);

  const counts = React.useMemo(() => {
    const c = { total: 0, pendente: 0, aprovado: 0, rejeitado: 0 };
    documentosRaw.forEach((d) => {
      c.total += 1;
      const st = (d.status || 'pendente').toLowerCase();
      if (st.includes('pendente')) c.pendente += 1;
      else if (st === 'aprovado') c.aprovado += 1;
      else if (st === 'rejeitado') c.rejeitado += 1;
    });
    return c;
  }, [documentosRaw]);

  const openDocPreview = (doc) => {
    setPreviewDoc(doc);
    setOpenPreview(true);
  };

  const closeDocPreview = () => {
    setOpenPreview(false);
    setPreviewDoc(null);
  };

  const handleDocStatus = async (documentoId, status) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/documentos/${documentoId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao atualizar documento (${res.status})`);
      }
      setSuccess('Status do documento atualizado.');
      await fetchFiliacao();
    } catch (e) {
      setError(e.message || 'Erro ao atualizar documento.');
    } finally {
      setSaving(false);
    }
  };

  const revisarDocs = async (aprovado) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/filiacoes/${filiacaoId}/revisar-docs`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ aprovado }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao revisar documentos (${res.status})`);
      }
      setSuccess(aprovado ? 'Documentos aprovados.' : 'Documentos rejeitados.');
      await fetchFiliacao();
    } catch (e) {
      setError(e.message || 'Erro ao revisar documentos.');
    } finally {
      setSaving(false);
    }
  };

  const revisarVinculo = async (aprovado) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/filiacoes/${filiacaoId}/revisar-vinculo`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ aprovado }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao revisar vínculo (${res.status})`);
      }
      setSuccess(aprovado ? 'Vínculo aprovado.' : 'Vínculo rejeitado.');
      await fetchFiliacao();
    } catch (e) {
      setError(e.message || 'Erro ao revisar vínculo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!filiacao) {
    return <Alert severity="error">Não foi possível carregar os dados da filiação.</Alert>;
  }

  const previewUrl = previewDoc ? buildUploadUrl(previewDoc.url_arquivo, atletaId) : '';
  const previewName = previewDoc?.nome_original || previewDoc?.url_arquivo || 'Documento';
  const previewExt = getExt(previewDoc?.nome_original || previewDoc?.url_arquivo);
  const previewKind = docKindByExt(previewExt);

  const roleLabel = isAdmin ? 'Administrador' : isProfessor ? 'Professor/Treinador' : (user?.tipo || 'Usuário');

  return (
    <Box>
      {/* Top bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Análise de Filiação #{filiacao.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Perfil: <b>{roleLabel}</b>
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Header card */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar
              src={fotoSrc || undefined}
              alt={filiacao?.atleta?.nome_completo || 'Filiado'}
              sx={{ width: 96, height: 96 }}
              imgProps={{
                onError: (e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '';
                }
              }}
            >
              {(filiacao?.atleta?.nome_completo || 'F').trim().charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {filiacao?.atleta?.nome_completo || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CPF: {filiacao?.atleta?.cpf || '—'}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                {statusChip(filiacao?.status)}
                {filiacao?.modalidade?.nome && <Chip size="small" label={`Modalidade: ${filiacao.modalidade.nome}`} />}
                {filiacao?.graduacao?.nome && <Chip size="small" label={`Graduação: ${filiacao.graduacao.nome}`} />}
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Academia
              </Typography>
              <Typography fontWeight="bold">
                {filiacao?.academia?.nome || '—'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Professor Responsável
              </Typography>
              <Typography fontWeight="bold">
                {filiacao?.professorResponsavel?.nome || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filiacao?.professorResponsavel?.email || ''}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Documents section */}
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold">
            Documentos enviados
          </Typography>

          {/* Filters row */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Todos (${counts.total})`}
                variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus('all')}
              />
              <Chip
                label={`Pendentes (${counts.pendente})`}
                color="warning"
                variant={filterStatus === 'pendente' ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus('pendente')}
              />
              <Chip
                label={`Aprovados (${counts.aprovado})`}
                color="success"
                variant={filterStatus === 'aprovado' ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus('aprovado')}
              />
              <Chip
                label={`Rejeitados (${counts.rejeitado})`}
                color="error"
                variant={filterStatus === 'rejeitado' ? 'filled' : 'outlined'}
                onClick={() => setFilterStatus('rejeitado')}
              />
            </Stack>

            <TextField
              size="small"
              placeholder="Buscar por tipo ou nome do arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', md: 420 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Stack>

          <Divider />

          {docsEnhanced.length === 0 ? (
            <Alert severity="info">
              Nenhum documento encontrado com os filtros atuais.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {docsEnhanced.map((doc) => {
                const Icon =
                  doc.kind === 'pdf' ? PictureAsPdfIcon :
                    doc.kind === 'image' ? ImageIcon :
                      InsertDriveFileIcon;

                const showThumb = doc.kind === 'image';

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Top row */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Icon />
                        <Typography variant="subtitle2" fontWeight="bold" noWrap title={doc.tipo_documento || ''} sx={{ flex: 1 }}>
                          {doc.tipo_documento || 'Documento'}
                        </Typography>
                      </Stack>

                      {/* Thumb / placeholder */}
                      <Box
                        sx={{
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          overflow: 'hidden',
                          height: 140,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.default',
                        }}
                      >
                        {showThumb ? (
                          <Box
                            component="img"
                            src={doc.url}
                            alt={doc.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = ''; }}
                          />
                        ) : (
                          <Stack alignItems="center" spacing={1} sx={{ p: 2 }}>
                            <Icon fontSize="large" />
                            <Typography variant="caption" color="text.secondary">
                              {doc.kind === 'pdf' ? 'PDF' : 'Arquivo'}
                            </Typography>
                          </Stack>
                        )}
                      </Box>

                      {/* File name + status */}
                      <Typography variant="body2" color="text.secondary" noWrap title={doc.name}>
                        {doc.name}
                      </Typography>
                      <Box>{statusChip(doc.status)}</Box>

                      {/* Actions */}
                      <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1 }} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => openDocPreview(doc)}>
                          Visualizar
                        </Button>

                        <Link href={doc.url} target="_blank" rel="noreferrer" underline="hover" sx={{ alignSelf: 'center' }}>
                          Baixar
                        </Link>

                        {/* Admin: aprova/rejeita docs; Professor: desabilitado */}
                        {canReviewDocs ? (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={saving}
                              onClick={() => handleDocStatus(doc.id, 'aprovado')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={saving}
                              onClick={() => handleDocStatus(doc.id, 'rejeitado')}
                            >
                              Rejeitar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Somente o administrador aprova/rejeita documentos">
                              <span>
                                <Button size="small" variant="outlined" disabled>
                                  Aprovar
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Somente o administrador aprova/rejeita documentos">
                              <span>
                                <Button size="small" variant="outlined" color="error" disabled>
                                  Rejeitar
                                </Button>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          <Divider />

          {/* Actions section */}
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Ações
            </Typography>

            {/* Admin: finaliza docs */}
            {canReviewDocs && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  disabled={saving}
                  onClick={() => revisarDocs(true)}
                >
                  Finalizar Docs: Aprovar
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  disabled={saving}
                  onClick={() => revisarDocs(false)}
                >
                  Finalizar Docs: Rejeitar
                </Button>
              </Stack>
            )}

            {/* Professor/Admin: vínculo */}
            {canReviewVinculo && (
              <>
                {!vinculoDisponivel && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    O vínculo só pode ser analisado quando o status estiver <b>pendente_aprovacao_professor</b>.
                    Status atual: <b>{filiacao?.status || '—'}</b>.
                  </Alert>
                )}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={saving || !vinculoDisponivel}
                    onClick={() => revisarVinculo(true)}
                  >
                    Aprovar Vínculo
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    disabled={saving || !vinculoDisponivel}
                    onClick={() => revisarVinculo(false)}
                  >
                    Rejeitar Vínculo
                  </Button>
                </Stack>
              </>
            )}

            {saving && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Processando...
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Preview Modal */}
      <Dialog open={openPreview} onClose={closeDocPreview} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pr: 6 }}>
          {previewName}
          <IconButton
            aria-label="Fechar"
            onClick={closeDocPreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {!previewDoc ? null : previewKind === 'pdf' ? (
            <iframe
              title="Preview PDF"
              src={previewUrl}
              style={{ width: '100%', height: '80vh', border: 0 }}
            />
          ) : previewKind === 'image' ? (
            <Box
              component="img"
              src={previewUrl}
              alt={previewName}
              sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
              onError={(e) => { e.currentTarget.src = ''; }}
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Pré-visualização não disponível para este tipo de arquivo.
              </Alert>
              <Link href={previewUrl} target="_blank" rel="noreferrer">
                Abrir/baixar arquivo
              </Link>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
