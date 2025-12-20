/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// API module for fetching Mega-Sena results

use crate::models::Resultado;
use reqwest::blocking::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct CaixaApiResponse {
    numero: i32,
    #[serde(rename = "dataApuracao")]
    data_apuracao: String,
    #[serde(rename = "dezenas")]
    dezenas: Vec<String>,
    acumulado: bool,
}

/// Busca resultado da API oficial da Caixa
fn fetch_caixa_api(concurso: i32) -> Result<Resultado, String> {
    let url = format!(
        "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/{}",
        concurso
    );

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API retornou status: {}", response.status()));
    }

    let data: CaixaApiResponse = response
        .json()
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    // Converter strings "01", "02" para números
    let numeros_sorteados: Vec<i32> = data
        .dezenas
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    if numeros_sorteados.len() != 6 {
        return Err(format!(
            "Número inválido de dezenas: {}",
            numeros_sorteados.len()
        ));
    }

    Ok(Resultado {
        concurso: data.numero,
        numeros_sorteados,
        data_sorteio: data.data_apuracao,
        acumulado: data.acumulado,
    })
}

fn fetch_google_search(concurso: i32) -> Result<Resultado, String> {
    // Apenas um placeholder para demonstrar a estratégia de fallback.
    // Em uma implementação real, usaríamos um serviço de busca ou scraping direto.
    // Para fins deste projeto ultra-minimalista, vamos simular o erro ou retorno seletivo.
    Err(format!("Fallback para concurso {} não disponível no momento.", concurso))
}

/// Busca o número do último concurso realizado na API da Caixa
pub fn obter_ultimo_concurso_numero() -> Result<i32, String> {
    let url = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/";

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let response = client
        .get(url)
        .send()
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API retornou status: {}", response.status()));
    }

    let data: CaixaApiResponse = response
        .json()
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    Ok(data.numero)
}

/// Função principal de verificação com fallback
pub fn verificar_resultado(concurso: i32) -> Result<Resultado, String> {
    // Tentar API Caixa
    match fetch_caixa_api(concurso) {
        Ok(resultado) => return Ok(resultado),
        Err(e) => {
            eprintln!("API Caixa falhou: {}", e);
            // Tentar Fallback
            match fetch_google_search(concurso) {
                Ok(resultado) => return Ok(resultado),
                Err(e2) => eprintln!("Fallback também falhou: {}", e2),
            }
        }
    }

    Err(format!(
        "Não foi possível obter resultado do concurso {}. Isso pode ser devido a atraso no sorteio oficial. Tente novamente em alguns minutos.",
        concurso
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Ignora por padrão (requer internet)
    fn test_fetch_caixa_api() {
        // Testar com um concurso recente conhecido
        let resultado = fetch_caixa_api(2650);
        assert!(resultado.is_ok());
        
        let res = resultado.unwrap();
        assert_eq!(res.concurso, 2650);
        assert_eq!(res.numeros_sorteados.len(), 6);
    }
}
