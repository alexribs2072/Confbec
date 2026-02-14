import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatarDataHoraBR } from '../utils/dateUtils';

// --- Importações do MUI ---
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
  Alert,
  Skeleton,
  Button,
  Divider
} from '@mui/material';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function HomePage() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulação ou chamada real da API
        const response = await axios.get('/api/noticias');
        setNoticias(response.data);
      } catch (err) {
        console.error("Erro ao buscar notícias:", err);
        setError("Não foi possível carregar as notícias. Tente recarregar a página.");
      } finally {
        setLoading(false);
      }
    };
    fetchNoticias();
  }, []);

  // --- Renderização: Estado de Carregamento (Skeletons) ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mx: 'auto', mb: 4 }} />
        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <Skeleton variant="rectangular" width={{ xs: '100%', md: 280 }} height={200} />
            <CardContent sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        ))}
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" variant="filled" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Portal de Notícias
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Fique por dentro das últimas atualizações da CONFBEC
        </Typography>
        <Divider sx={{ mt: 2, width: '100px', mx: 'auto', borderBottomWidth: 3, borderColor: 'primary.main' }} />
      </Box>

      <Box>
        {noticias.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <NewspaperIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma notícia encontrada no momento.
            </Typography>
          </Box>
        ) : (
          noticias.map((noticia) => (
            <Card 
              key={noticia.id} 
              elevation={3}
              sx={{ 
                mb: 4, 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                transition: '0.3s',
                '&:hover': { 
                  transform: 'translateY(-5px)',
                  boxShadow: 10 
                }
              }}
            >
              {noticia.imagem_url && (
                <CardMedia
                  component="img"
                  sx={{ 
                    width: { xs: '100%', md: 280 }, 
                    height: { xs: 220, md: 'auto' }, 
                    objectFit: 'cover'
                  }}
                  image={noticia.imagem_url}
                  alt={noticia.titulo}
                />
              )}
              
              <CardContent sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                p: 3
              }}>
                <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>
                  {noticia.titulo}
                </Typography>
                
                {noticia.subtitulo && (
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {noticia.subtitulo}
                  </Typography>
                )}
                
                <Typography variant="caption" color="text.disabled" sx={{ mb: 2, display: 'block' }}>
                  Publicado em: {formatarDataHoraBR(noticia.publicada_em)}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    lineHeight: 1.7, 
                    mb: 3,
                    display: '-webkit-box',
                    WebkitLineClamp: 3, // Limita a 3 linhas visualmente
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {noticia.conteudo}
                </Typography>

                <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    endIcon={<ArrowForwardIcon />}
                    sx={{ borderRadius: 2 }}
                    // onClick={() => handleOpenNoticia(noticia.id)}
                  >
                    Ler Notícia Completa
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Container>
  );
}

export default HomePage;