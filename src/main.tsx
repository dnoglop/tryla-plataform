// ARQUIVO: src/main.tsx
// CÓDIGO COMPLETO E ATUALIZADO

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Importe o QueryClient e o QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Importe o nosso RewardModalProvider
import { RewardModalProvider } from './components/XpRewardModal/RewardModalContext';

// 3. Crie uma instância ÚNICA do QueryClient
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 4. Envolva a aplicação na ordem correta */}
    <QueryClientProvider client={queryClient}>
      <RewardModalProvider>
        <App />
      </RewardModalProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)