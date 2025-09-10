import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Facebook Pixel (obrigatório configurar no .env)
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Validar se as configurações obrigatórias estão definidas
if (!FACEBOOK_PIXEL_ID || !FACEBOOK_ACCESS_TOKEN) {
  console.error('❌ ERRO: Configure as variáveis FACEBOOK_PIXEL_ID e FACEBOOK_ACCESS_TOKEN no arquivo .env');
  console.error('📝 Copie o arquivo .env.example para .env e configure suas credenciais');
  process.exit(1);
}

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});
app.use('/webhook', limiter);

// Função para hash de dados sensíveis
const hashData = (data) => {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
};

// Função para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para validar telefone
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Função para enviar evento para o Facebook Pixel
const sendEventToFacebook = async (eventData) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PIXEL_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [eventData],
        test_event_code: process.env.TEST_EVENT_CODE || undefined
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Facebook API Error: ${JSON.stringify(result)}`);
    }

    return { success: true, result };
  } catch (error) {
    console.error('Erro ao enviar evento para Facebook:', error);
    throw error;
  }
};

// Função para processar dados do usuário
const processUserData = (userData) => {
  const processed = {};
  
  if (userData.email && isValidEmail(userData.email)) {
    processed.em = [hashData(userData.email)];
  }
  
  if (userData.phone && isValidPhone(userData.phone)) {
    processed.ph = [hashData(userData.phone.replace(/\D/g, ''))];
  }
  
  if (userData.firstName) {
    processed.fn = [hashData(userData.firstName)];
  }
  
  if (userData.lastName) {
    processed.ln = [hashData(userData.lastName)];
  }
  
  if (userData.city) {
    processed.ct = [hashData(userData.city)];
  }
  
  if (userData.state) {
    processed.st = [hashData(userData.state)];
  }
  
  if (userData.zipCode) {
    processed.zp = [hashData(userData.zipCode.replace(/\D/g, ''))];
  }
  
  if (userData.country) {
    processed.country = [hashData(userData.country)];
  }

  return processed;
};

// Endpoint principal do webhook
app.post('/webhook/facebook-pixel', async (req, res) => {
  try {
    const { 
      eventName, 
      userData = {}, 
      customData = {}, 
      eventTime,
      sourceUrl,
      userAgent,
      clientIp
    } = req.body;

    // Validações básicas
    if (!eventName) {
      return res.status(400).json({
        error: 'eventName é obrigatório',
        code: 'MISSING_EVENT_NAME'
      });
    }

    // Eventos suportados
    const supportedEvents = [
      'Purchase', 'AddToCart', 'InitiateCheckout', 'Lead', 
      'CompleteRegistration', 'ViewContent', 'Search', 
      'AddToWishlist', 'PageView'
    ];

    if (!supportedEvents.includes(eventName)) {
      return res.status(400).json({
        error: `Evento não suportado. Eventos válidos: ${supportedEvents.join(', ')}`,
        code: 'UNSUPPORTED_EVENT'
      });
    }

    // Montar dados do evento
    const eventData = {
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: sourceUrl || req.get('origin') || 'unknown',
      user_data: processUserData(userData)
    };

    // Adicionar dados customizados se fornecidos
    if (Object.keys(customData).length > 0) {
      eventData.custom_data = {};
      
      // Validar e adicionar dados customizados comuns
      if (customData.value && !isNaN(customData.value)) {
        eventData.custom_data.value = parseFloat(customData.value);
      }
      
      if (customData.currency) {
        eventData.custom_data.currency = customData.currency.toUpperCase();
      } else {
        eventData.custom_data.currency = 'BRL'; // padrão brasileiro
      }
      
      // Outros campos customizados
      ['content_name', 'content_category', 'content_ids', 'num_items'].forEach(field => {
        if (customData[field] !== undefined) {
          eventData.custom_data[field] = customData[field];
        }
      });
    }

    // Adicionar informações do cliente se disponíveis
    if (userAgent || req.get('user-agent')) {
      eventData.user_data.client_user_agent = userAgent || req.get('user-agent');
    }

    if (clientIp || req.ip) {
      eventData.user_data.client_ip_address = clientIp || req.ip;
    }

    // Enviar evento para Facebook
    const result = await sendEventToFacebook(eventData);

    // Log do evento processado
    console.log('Evento enviado com sucesso:', {
      eventName,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Evento enviado com sucesso',
      eventId: result.result.events_received || 1,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para verificação do webhook (usado pelo Facebook)
app.get('/webhook/facebook-pixel', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verificado com sucesso!');
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: 'Token de verificação inválido' });
    }
  } else {
    res.status(400).json({ error: 'Parâmetros de verificação ausentes' });
  }
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Endpoint para listar eventos suportados
app.get('/webhook/facebook-pixel/events', (req, res) => {
  const events = [
    { name: 'Purchase', description: 'Compra realizada' },
    { name: 'AddToCart', description: 'Produto adicionado ao carrinho' },
    { name: 'InitiateCheckout', description: 'Checkout iniciado' },
    { name: 'Lead', description: 'Lead capturado' },
    { name: 'CompleteRegistration', description: 'Registro completo' },
    { name: 'ViewContent', description: 'Conteúdo visualizado' },
    { name: 'Search', description: 'Busca realizada' },
    { name: 'AddToWishlist', description: 'Adicionado à lista de desejos' },
    { name: 'PageView', description: 'Página visualizada' }
  ];

  res.status(200).json({ events });
});

// Middleware para capturar rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    code: 'NOT_FOUND',
    availableEndpoints: [
      'POST /webhook/facebook-pixel',
      'GET /webhook/facebook-pixel',
      'GET /webhook/facebook-pixel/events',
      'GET /health'
    ]
  });
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Webhook servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Facebook Pixel Webhook: http://localhost:${PORT}/webhook/facebook-pixel`);
  console.log(`🔐 Token de verificação: ${WEBHOOK_VERIFY_TOKEN}`);
  console.log('✅ Configurações carregadas com sucesso!');
});

export default app;
