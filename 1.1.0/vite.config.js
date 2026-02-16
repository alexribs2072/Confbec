// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 1. ADICIONE O PLUGIN DO REACT (Estava faltando!)
  plugins: [react()],

  server: {
    // 2. Garante que o Vite ouça em todas as interfaces de rede do contêiner
    host: '0.0.0.0', 
    port: 5173,
    strictPort: true, // Evita que o Vite tente outra porta se a 5173 estiver ocupada

    // 3. CORREÇÃO PARA O ERRO 403: Autoriza o host vindo do Nginx
    // O Vite 6/7 bloqueia conexões de proxies por padrão por segurança
    allowedHosts: ['localhost', '127.0.0.1','frontend','.localhost'], 

    // 4. Configuração de Hot Reload (HMR) via Nginx seguro (WSS)
    hmr: {
      clientPort: 443, // Porta que o seu navegador vê (Nginx)
      protocol: 'wss', // Protocolo WebSocket Seguro
    },
    
    // Otimização para volumes Docker (especialmente se estiver usando Windows/Mac)
    watch: {
      usePolling: true,
    },
  },
})