// Variável que guarda o estado da conversa no seu app
let conversationHistory = []; 

async function sendMessage(prompt, module, userName) {
  const response = await fetch('URL_DA_SUA_FUNCAO_DENO', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // outros headers, como autorização, se houver
    },
    body: JSON.stringify({
      prompt: prompt,
      module: module,
      userName: userName,
      history: conversationHistory // Enviando o histórico atual!
    })
  });

  if (!response.ok) {
    console.error("Erro ao contatar o backend.");
    return;
  }

  const data = await response.json();

  // Exibe a resposta na tela
  console.log("Tutor Tryla:", data.resposta);
  // adicione a lógica para mostrar a resposta na UI

  // ATUALIZA O HISTÓRICO LOCAL com o que o backend retornou
  conversationHistory = data.history; 
}

// Para usar:
// Primeira mensagem
// sendMessage("Olá, quem é você?", "autoconhecimento", "Carlos");

// Depois da primeira resposta, a variável `conversationHistory` terá sido atualizada.
// A próxima chamada já terá contexto:
// sendMessage("Legal! Pode me dar um exemplo prático disso?", "autoconhecimento", "Carlos");