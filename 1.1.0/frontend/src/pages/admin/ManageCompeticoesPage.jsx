import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ESCOPO_OPTIONS = ["MUNICIPAL", "ESTADUAL", "NACIONAL", "INTERNACIONAL"];
const STATUS_OPTIONS = ["RASCUNHO", "INSCRICOES_ABERTAS", "INSCRICOES_FECHADAS", "CANCELADO"];

function toDateInput(v) {
  if (!v) return "";
  // aceita "2026-03-16T00:00:00.000Z" ou "2026-03-16"
  return String(v).slice(0, 10);
}

export default function ManageCompeticoesPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [eventos, setEventos] = useState([]);
  const [q, setQ] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    local: "",
    escopo: "MUNICIPAL",
    data_evento: "",
    data_fim: "",
    status: "RASCUNHO",
    taxa_inscricao: 0,
  });

  // Modalidades (para vínculo)
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState([]);
  const [selectedModalidadeIds, setSelectedModalidadeIds] = useState([]);
  const [taxaPorModalidade, setTaxaPorModalidade] = useState({});

  const filteredEventos = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return eventos;
    return eventos.filter((e) => {
      const a = (e.nome || "").toLowerCase();
      const b = (e.local || "").toLowerCase();
      const c = (e.escopo || "").toLowerCase();
      const d = (e.status || "").toLowerCase();
      return a.includes(term) || b.includes(term) || c.includes(term) || d.includes(term);
    });
  }, [eventos, q]);

  async function fetchEventos() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/competicoes/eventos");
      setEventos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar competições."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchModalidadesDisponiveis() {
    try {
      const res = await axios.get("/api/competicoes/modalidades");
      setModalidadesDisponiveis(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // não trava a tela, mas mostra erro
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar modalidades disponíveis."
      );
    }
  }

  async function fetchEventoById(eventoId) {
    // se seu backend NÃO tiver esse endpoint, comente e use apenas o objeto vindo da lista
    const res = await axios.get(`/api/competicoes/eventos/${eventoId}`);
    return res.data;
  }

  useEffect(() => {
    fetchEventos();
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleCloseDialog() {
    setOpenDialog(false);
    setEditingId(null);
    setSelectedModalidadeIds([]);
    setTaxaPorModalidade({});
    setModalidadesDisponiveis([]);
    setFormData({
      nome: "",
      descricao: "",
      local: "",
      escopo: "MUNICIPAL",
      data_evento: "",
      data_fim: "",
      status: "RASCUNHO",
      taxa_inscricao: 0,
    });
  }

  async function handleNew() {
    resetMessages();
    setEditingId(null);
    setFormData({
      nome: "",
      descricao: "",
      local: "",
      escopo: "MUNICIPAL",
      data_evento: "",
      data_fim: "",
      status: "RASCUNHO",
      taxa_inscricao: 0,
    });
    setSelectedModalidadeIds([]);
    setTaxaPorModalidade({});
    await fetchModalidadesDisponiveis();
    setOpenDialog(true);
  }

  async function handleEdit(evento) {
    resetMessages();
    setEditingId(evento.id);

    // tenta buscar o evento completo (com modalidades), se existir endpoint
    let full = evento;
    try {
      full = await fetchEventoById(evento.id);
    } catch {
      // se não existir, segue com o que veio da lista
      full = evento;
    }

    setFormData({
      nome: full.nome || "",
      descricao: full.descricao || "",
      local: full.local || "",
      escopo: full.escopo || "MUNICIPAL",
      data_evento: toDateInput(full.data_evento),
      data_fim: toDateInput(full.data_fim),
      status: full.status || "RASCUNHO",
      taxa_inscricao: Number(full.taxa_inscricao ?? 0),
    });

    const vinculadas = (full.modalidades || []).map((m) => m.id);
    setSelectedModalidadeIds(vinculadas);

    const taxaMap = {};
    (full.modalidades || []).forEach((m) => {
      const tx = m?.CompeticaoEventoModalidade?.taxa_inscricao;
      taxaMap[m.id] = Number(tx ?? full.taxa_inscricao ?? 0);
    });
    setTaxaPorModalidade(taxaMap);

    await fetchModalidadesDisponiveis();
    setOpenDialog(true);
  }

  async function handleCancelEvento(eventoId) {
    resetMessages();
    const ok = window.confirm("Tem certeza que deseja cancelar esta competição? Ela não será apagada, apenas marcada como CANCELADO.");
    if (!ok) return;

    setLoading(true);
    try {
      await axios.delete(`/api/competicoes/eventos/${eventoId}`);
      setSuccess("Competição cancelada com sucesso.");
      await fetchEventos();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Falha ao cancelar competição."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetMessages();
    setSaving(true);

    try {
      // validações mínimas
      if (!formData.nome.trim()) throw new Error("Informe o nome da competição.");
      if (!formData.local.trim()) throw new Error("Informe o local.");
      if (!formData.data_evento) throw new Error("Informe a data do evento.");

      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null,
        local: formData.local.trim(),
        escopo: formData.escopo,
        data_evento: formData.data_evento,
        data_fim: formData.data_fim || null,
        status: formData.status,
        taxa_inscricao: Number(formData.taxa_inscricao ?? 0),
      };

      let eventoId = editingId;

      if (editingId) {
        await axios.put(`/api/competicoes/eventos/${editingId}`, payload);
      } else {
        const created = await axios.post(`/api/competicoes/eventos`, payload);
        eventoId = created?.data?.id;
        if (!eventoId) {
          throw new Error("Evento criado, mas não retornou ID. Verifique o backend.");
        }
      }

      // vínculo de modalidades (somente se tiver id do evento)
      const modalidadesPayload = (selectedModalidadeIds || []).map((id) => ({
        id,
        taxa_inscricao: Number(taxaPorModalidade?.[id] ?? formData.taxa_inscricao ?? 0),
      }));

      await axios.put(`/api/competicoes/eventos/${eventoId}/modalidades`, {
        modalidades: modalidadesPayload,
      });

      setSuccess(editingId ? "Competição atualizada com sucesso." : "Competição criada com sucesso.");
      await fetchEventos();
      handleCloseDialog();
    } catch (e2) {
      setError(
        e2?.response?.data?.message ||
          e2?.message ||
          "Falha ao salvar competição."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Competições</Typography>
        <Button variant="contained" onClick={handleNew}>
          Nova Competição
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Buscar por nome, local, escopo ou status"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Nome</b></TableCell>
                <TableCell><b>Escopo</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Data</b></TableCell>
                <TableCell><b>Local</b></TableCell>
                <TableCell align="right"><b>Ações</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredEventos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 3 }}>
                      <Typography>Nenhuma competição encontrada.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEventos.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.nome}</TableCell>
                    <TableCell>
                      <Chip label={ev.escopo || "—"} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ev.status || "—"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{toDateInput(ev.data_evento) || "—"}</TableCell>
                    <TableCell>{ev.local || "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(ev)} title="Editar">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleCancelEvento(ev.id)}
                        title="Cancelar"
                        disabled={ev.status === "CANCELADO"}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog Criar/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? "Editar Competição" : "Nova Competição"}</DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="Nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel id="escopo-label">Escopo</InputLabel>
                <Select
                  labelId="escopo-label"
                  label="Escopo"
                  value={formData.escopo}
                  onChange={(e) => setFormData({ ...formData, escopo: e.target.value })}
                >
                  {ESCOPO_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Data do evento"
                type="date"
                value={formData.data_evento}
                onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                label="Data fim (opcional)"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Taxa de inscrição"
                type="number"
                value={formData.taxa_inscricao}
                onChange={(e) => setFormData({ ...formData, taxa_inscricao: e.target.value })}
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />

              <TextField
                label="Descrição (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                fullWidth
                multiline
                minRows={2}
                sx={{ gridColumn: "1 / -1" }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
              Modalidades do evento
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="modalidades-label">Selecione as modalidades</InputLabel>
              <Select
                labelId="modalidades-label"
                multiple
                value={selectedModalidadeIds}
                label="Selecione as modalidades"
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedModalidadeIds(next);
                  setTaxaPorModalidade((prev) => {
                    const copy = { ...(prev || {}) };
                    (next || []).forEach((id) => {
                      if (copy[id] === undefined) copy[id] = Number(formData.taxa_inscricao ?? 0);
                    });
                    Object.keys(copy).forEach((k) => {
                      if (!(next || []).some((v) => String(v) === String(k))) delete copy[k];
                    });
                    return copy;
                  });
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => {
                      const mod = modalidadesDisponiveis.find((m) => m.id === id);
                      return <Chip key={id} label={mod ? mod.nome : `ID ${id}`} />;
                    })}
                  </Box>
                )}
              >
                {modalidadesDisponiveis.map((mod) => (
                  <MenuItem key={mod.id} value={mod.id}>
                    <Checkbox checked={selectedModalidadeIds.indexOf(mod.id) > -1} />
                    <ListItemText primary={mod.nome} secondary={mod.code} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedModalidadeIds.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Modalidade</b></TableCell>
                        <TableCell width={180}><b>Taxa (R$)</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedModalidadeIds.map((id) => {
                        const m = modalidadesDisponiveis.find((x) => String(x.id) === String(id));
                        return (
                          <TableRow key={id}>
                            <TableCell>{m?.nome || `ID ${id}`}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={taxaPorModalidade?.[id] ?? 0}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setTaxaPorModalidade((prev) => ({ ...(prev || {}), [id]: v }));
                                }}
                                inputProps={{ min: 0, step: '0.01' }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Alert severity="info" sx={{ mt: 1 }}>
                  O atleta paga por modalidade inscrita. Se a taxa for 0, a inscrição pode ser confirmada sem cobrança.
                </Alert>
              </Box>
            )}

            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              Dica: você pode selecionar várias modalidades. Ao salvar, o sistema substitui os vínculos do evento por esta lista.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
