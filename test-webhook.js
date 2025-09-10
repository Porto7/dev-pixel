// Arquivo para testar o webhook localmente
// Execute: node test-webhook.js

import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3000/webhook/facebook-pixel';

// Função para testar diferentes eventos
const testEvents = async () => {
  console.log('🧪 Iniciando testes do webhook...\n');

  // Teste 1: Purchase (Compra)
  console.log('📦 Testando evento Purchase...');
  try {
    const purchaseResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Purchase',
        userData: {
          email: 'teste@exemplo.com',
          phone: '+5511999999999',
          firstName: 'João',
          lastName: 'Silva',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          country: 'BR'
        },
        customData: {
          value: 149.90,
          currency: 'BRL',
          content_name: 'Smartphone XYZ',
          content_category: 'Eletrônicos',
          content_ids: ['prod_123'],
          num_items: 1
        },
        sourceUrl: 'https://exemplo.com/checkout'
      })
    });

    const purchaseResult = await purchaseResponse.json();
    console.log('✅ Purchase:', purchaseResult.success ? 'SUCCESS' : 'FAILED');
    if (!purchaseResult.success) console.log('❌ Error:', purchaseResult.error);
  } catch (error) {
    console.log('❌ Purchase FAILED:', error.message);
  }

  // Teste 2: AddToCart
  console.log('\n🛒 Testando evento AddToCart...');
  try {
    const addToCartResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'AddToCart',
        userData: {
          email: 'cliente@teste.com',
          firstName: 'Maria'
        },
        customData: {
          value: 59.90,
          currency: 'BRL',
          content_name: 'Camiseta Azul',
          content_category: 'Roupas'
        }
      })
    });

    const addToCartResult = await addToCartResponse.json();
    console.log('✅ AddToCart:', addToCartResult.success ? 'SUCCESS' : 'FAILED');
    if (!addToCartResult.success) console.log('❌ Error:', addToCartResult.error);
  } catch (error) {
    console.log('❌ AddToCart FAILED:', error.message);
  }

  // Teste 3: Lead
  console.log('\n📝 Testando evento Lead...');
  try {
    const leadResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Lead',
        userData: {
          email: 'lead@exemplo.com',
          phone: '+5511888888888',
          firstName: 'Carlos',
          lastName: 'Santos'
        },
        customData: {
          content_name: 'Newsletter Signup',
          content_category: 'Lead Magnet'
        }
      })
    });

    const leadResult = await leadResponse.json();
    console.log('✅ Lead:', leadResult.success ? 'SUCCESS' : 'FAILED');
    if (!leadResult.success) console.log('❌ Error:', leadResult.error);
  } catch (error) {
    console.log('❌ Lead FAILED:', error.message);
  }

  // Teste 4: Evento inválido
  console.log('\n❌ Testando evento inválido...');
  try {
    const invalidResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'InvalidEvent',
        userData: {
          email: 'teste@exemplo.com'
        }
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('✅ Invalid Event:', !invalidResult.success ? 'CORRECTLY REJECTED' : 'UNEXPECTEDLY ACCEPTED');
    if (!invalidResult.success) console.log('📝 Error message:', invalidResult.error);
  } catch (error) {
    console.log('❌ Invalid Event test FAILED:', error.message);
  }

  // Teste 5: Health check
  console.log('\n🏥 Testando health check...');
  try {
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthResult = await healthResponse.json();
    console.log('✅ Health Check:', healthResult.status === 'ok' ? 'SUCCESS' : 'FAILED');
    console.log('📊 Server uptime:', Math.round(healthResult.uptime), 'seconds');
  } catch (error) {
    console.log('❌ Health Check FAILED:', error.message);
  }

  // Teste 6: Listar eventos suportados
  console.log('\n📋 Testando lista de eventos...');
  try {
    const eventsResponse = await fetch('http://localhost:3000/webhook/facebook-pixel/events');
    const eventsResult = await eventsResponse.json();
    console.log('✅ Events List:', eventsResult.events ? 'SUCCESS' : 'FAILED');
    console.log('📝 Total events supported:', eventsResult.events?.length || 0);
  } catch (error) {
    console.log('❌ Events List FAILED:', error.message);
  }

  console.log('\n🎉 Testes concluídos!');
};

// Executar testes
testEvents().catch(console.error);
