use crate::database::Database;
use crate::models::{Aposta, ApostaResultado, Resultado};
use crate::api;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn adicionar_aposta(
    db: State<'_, Mutex<Database>>,
    numeros: Vec<i32>,
    concurso_inicial: i32,
    quantidade_concursos: i32,
) -> Result<Aposta, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    // Validações
    if numeros.len() < 6 || numeros.len() > 15 {
        return Err("Selecione entre 6 e 15 números".to_string());
    }
    
    if concurso_inicial <= 0 {
        return Err("Concurso inválido".to_string());
    }
    
    if quantidade_concursos < 1 || quantidade_concursos > 12 {
        return Err("Quantidade de concursos deve ser entre 1 e 12".to_string());
    }

    db.adicionar_aposta(numeros, concurso_inicial, quantidade_concursos)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn listar_apostas(db: State<'_, Mutex<Database>>) -> Result<Vec<Aposta>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.listar_apostas().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn excluir_aposta(db: State<'_, Mutex<Database>>, id: i64) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.excluir_aposta(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn verificar_resultados(
    db: State<'_, Mutex<Database>>,
    concurso: i32,
) -> Result<Resultado, String> {
    // Buscar resultado da API
    let resultado = api::verificar_resultado(concurso)?;
    
    // Salvar no banco de dados (em background)
    let db_clone = db.inner().clone();
    tokio::spawn(async move {
        if let Ok(db) = db_clone.lock() {
            let _ = db.salvar_resultado(&resultado);
        }
    });
    
    Ok(resultado)
}

/// Calcular acertos entre números apostados e sorteados
fn calcular_acertos(numeros_aposta: &[i32], numeros_sorteados: &[i32]) -> i32 {
    numeros_aposta
        .iter()
        .filter(|n| numeros_sorteados.contains(n))
        .count() as i32
}
