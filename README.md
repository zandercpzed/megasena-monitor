# MegaSena Monitor

Aplicativo desktop minimalista para gerenciar apostas da Mega-Sena com verificação automática de resultados.

## 🚀 Quick Start

```bash
# Clone o repositório
git clone https://github.com/zandercpzed/megasena-monitor.git
cd megasena-monitor/megasena-app

# Instale dependências
npm install

# Execute em modo desenvolvimento
npm run tauri dev
```

## ✨ Funcionalidades

- ✅ **Cadastro de Apostas**: Selecione 6-15 números em grid visual
- ✅ **Teimosinha**: Suporte para 1-12 concursos consecutivos
- ✅ **Verificação Automática**: Busca resultados da API oficial da Caixa
- ✅ **100% Offline**: SQLite local para armazenamento
- ✅ **Design Minimalista**: Interface limpa com esferas verdes

## 🛠️ Stack Tecnológica

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Tauri 2.0 (Rust)
- **Database**: SQLite (bundled)
- **Build**: Vite 7.0

## 📦 Build para Produção

```bash
# macOS
npm run tauri build
# Output: src-tauri/target/release/bundle/macos/MegaSena.app

# Windows/Linux
# Configurar GitHub Actions CI/CD (futuro)
```

## 📝 Licença

GNU GPL v3.0
