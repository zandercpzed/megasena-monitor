// Modelos de dados para MegaSena App

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Aposta {
    pub id: i64,
    pub numeros: Vec<i32>,
    pub concurso_inicial: i32,
    pub quantidade_concursos: i32,
    pub data_criacao: String,
    pub ativa: bool,
    pub acertos: std::collections::HashMap<i32, i32>,
    pub resultados_concursos: std::collections::HashMap<i32, Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Resultado {
    pub concurso: i32,
    pub numeros_sorteados: Vec<i32>,
    pub data_sorteio: String,
    pub acumulado: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApostaResultado {
    pub aposta_id: i64,
    pub concurso: i32,
    pub acertos: i32,
}
