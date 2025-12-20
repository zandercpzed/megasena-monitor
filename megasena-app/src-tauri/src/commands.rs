// Tauri commands for frontend integration

use crate::database::Database;
use crate::models::Aposta;
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
