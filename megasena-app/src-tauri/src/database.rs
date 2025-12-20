// Database operations for MegaSena App

use rusqlite::{params, Connection, Result};
use serde_json;
use std::path::PathBuf;
use crate::models::Aposta;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        Ok(Database { conn })
    }

    pub fn init(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS apostas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numeros TEXT NOT NULL,
                concurso_inicial INTEGER NOT NULL,
                quantidade_concursos INTEGER NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativa BOOLEAN DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS resultados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concurso INTEGER NOT NULL UNIQUE,
                numeros_sorteados TEXT NOT NULL,
                data_sorteio DATE,
                acumulado BOOLEAN,
                data_verificacao DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS apostas_resultados (
                aposta_id INTEGER,
                concurso INTEGER,
                acertos INTEGER,
                FOREIGN KEY (aposta_id) REFERENCES apostas(id),
                FOREIGN KEY (concurso) REFERENCES resultados(concurso)
            );",
        )?;
        Ok(())
    }

    pub fn adicionar_aposta(
        &self,
        numeros: Vec<i32>,
        concurso_inicial: i32,
        quantidade_concursos: i32,
    ) -> Result<Aposta> {
        let numeros_json = serde_json::to_string(&numeros).unwrap();
        
        self.conn.execute(
            "INSERT INTO apostas (numeros, concurso_inicial, quantidade_concursos) VALUES (?1, ?2, ?3)",
            params![numeros_json, concurso_inicial, quantidade_concursos],
        )?;

        let id = self.conn.last_insert_rowid();

        let mut stmt = self.conn.prepare(
            "SELECT id, numeros, concurso_inicial, quantidade_concursos, 
             datetime(data_criacao) as data_criacao, ativa 
             FROM apostas WHERE id = ?1"
        )?;

        let aposta = stmt.query_row(params![id], |row| {
            let numeros_str: String = row.get(1)?;
            let numeros: Vec<i32> = serde_json::from_str(&numeros_str).unwrap();

            Ok(Aposta {
                id: row.get(0)?,
                numeros,
                concurso_inicial: row.get(2)?,
                quantidade_concursos: row.get(3)?,
                data_criacao: row.get(4)?,
                ativa: row.get(5)?,
            })
        })?;

        Ok(aposta)
    }

    pub fn listar_apostas(&self) -> Result<Vec<Aposta>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, numeros, concurso_inicial, quantidade_concursos, 
             datetime(data_criacao) as data_criacao, ativa 
             FROM apostas 
             WHERE ativa = 1 
             ORDER BY id DESC"
        )?;

        let apostas = stmt
            .query_map([], |row| {
                let numeros_str: String = row.get(1)?;
                let numeros: Vec<i32> = serde_json::from_str(&numeros_str).unwrap();

                Ok(Aposta {
                    id: row.get(0)?,
                    numeros,
                    concurso_inicial: row.get(2)?,
                    quantidade_concursos: row.get(3)?,
                    data_criacao: row.get(4)?,
                    ativa: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(apostas)
    }

    pub fn excluir_aposta(&self, id: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE apostas SET ativa = 0 WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn salvar_resultado(&self, resultado: &crate::models::Resultado) -> Result<()> {
        let numeros_json = serde_json::to_string(&resultado.numeros_sorteados).unwrap();
        
        self.conn.execute(
            "INSERT OR REPLACE INTO resultados (concurso, numeros_sorteados, data_sorteio, acumulado)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                resultado.concurso,
                numeros_json,
                resultado.data_sorteio,
                resultado.acumulado
            ],
        )?;
        Ok(())
    }

    pub fn obter_resultado(&self, concurso: i32) -> Result<Option<crate::models::Resultado>> {
        let mut stmt = self.conn.prepare(
            "SELECT concurso, numeros_sorteados, data_sorteio, acumulado
             FROM resultados
             WHERE concurso = ?1"
        )?;

        let resultado = stmt.query_row(params![concurso], |row| {
            let numeros_str: String = row.get(1)?;
            let numeros_sorteados: Vec<i32> = serde_json::from_str(&numeros_str).unwrap();

            Ok(crate::models::Resultado {
                concurso: row.get(0)?,
                numeros_sorteados,
                data_sorteio: row.get(2)?,
                acumulado: row.get(3)?,
            })
        });

        match resultado {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
}
