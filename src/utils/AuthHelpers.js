/**
 * Utilitário de tradução e tratamento de erros do Supabase Auth (GoTrue)
 * Converte erros técnicos em inglês para mensagens humanas e em português.
 */
export function traduzirErroSupabase(error) {
  if (!error) return 'Ocorreu um erro inesperado.';
  
  const mensagemOriginal = error.message || '';
  
  // Dicionário de mapeamento de erros comuns do Supabase Auth
  if (mensagemOriginal.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
  }
  if (mensagemOriginal.includes('User already registered')) {
    return 'Este endereço de e-mail já está cadastrado no sistema.';
  }
  if (mensagemOriginal.includes('Password should be at least')) {
    return 'A senha digitada é muito curta. Use pelo menos 6 caracteres.';
  }
  if (mensagemOriginal.includes('Email rate limit exceeded')) {
    return 'Limite de envios excedido. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (mensagemOriginal.includes('Over signup rate limit')) {
    return 'Muitas tentativas de cadastro seguidas. Por favor, tente novamente mais tarde.';
  }
  if (mensagemOriginal.includes('Email address not verified')) {
    return 'Este e-mail ainda não foi confirmado. Verifique seu lixo eletrônico ou caixa de entrada.';
  }
  if (mensagemOriginal.includes('User not found')) {
    return 'Não encontramos nenhum usuário com este e-mail.';
  }
  if (mensagemOriginal.includes('New password should be different')) {
    return 'Sua nova senha não pode ser igual à senha antiga.';
  }
  if (mensagemOriginal.includes('Network request failed') || mensagemOriginal.includes('Failed to fetch')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  }

  // Retorno padrão caso caia em algum erro incomum do banco
  return mensagemOriginal || 'Erro ao processar autenticação.';
}

/**
 * Validação prévia de segurança no cliente (Frontend)
 * Evita sobrecarregar o Supabase com dados visivelmente mal formatados.
 */
export function validarCamposAuth(email, password, exigirSenhaForte = true) {
  // Validação simples de e-mail
  if (!email || !email.includes('@') || email.trim().length < 5) {
    return { valido: false, mensagem: 'Por favor, insira um endereço de e-mail válido.' };
  }
  
  // Validação de preenchimento da senha
  if (!password || password.trim() === '') {
    return { valido: false, mensagem: 'A senha não pode estar em branco.' };
  }

  // Regras de Força de Senha (ativadas no cadastro e na troca de senha)
  if (exigirSenhaForte) {
    if (password.length < 6) {
      return { valido: false, mensagem: 'Para sua segurança, a senha deve conter no mínimo 6 caracteres.' };
    }
    if (!/\d/.test(password)) {
      return { valido: false, mensagem: 'A senha deve conter pelo menos um número (ex: 0-9).' };
    }
  }

  return { valido: true };
}