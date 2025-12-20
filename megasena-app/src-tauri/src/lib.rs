// Lib.rs - Main library file for Tauri app

mod api;
mod commands;
mod database;
mod models;

use database::Database;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Inicializar database
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            
            let db_path = app_dir.join("megasena.db");
            let db = Database::new(db_path).expect("failed to initialize database");
            db.init().expect("failed to create tables");
            
            // Gerenciar estado do database
            app.manage(Mutex::new(db));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::adicionar_aposta,
            commands::listar_apostas,
            commands::excluir_aposta,
            commands::verificar_resultados,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
