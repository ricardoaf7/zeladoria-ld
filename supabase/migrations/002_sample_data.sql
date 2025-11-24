-- Insert sample service areas for testing
INSERT INTO service_areas (
  ordem, tipo, endereco, bairro, metragem_m2, lat, lng, lote, status, history, servico
) VALUES 
-- Capina e Roçagem - Lote 1
(1, 'area publica', 'Av Jorge Casoni - Terminal Rodoviário', 'Casoni', 29184.98, -23.3044206, -51.1513729, 1, 'Pendente', '[]', 'rocagem'),
(2, 'praça', 'Rua Carijós c/ Oraruana', 'Paraná', 2332.83, -23.3045262, -51.1480067, 1, 'Pendente', '[]', 'rocagem'),
(3, 'area publica', 'Av Saul Elkind', 'Lago Parque', 15234.56, -23.2987, -51.1623, 1, 'Pendente', '[]', 'rocagem'),
(4, 'canteiro', 'Av Madre Leônia Milito', 'Centro', 8765.43, -23.3101, -51.1628, 1, 'Pendente', '[]', 'rocagem'),
(5, 'area publica', 'Praça Sete de Setembro', 'Centro', 12456.78, -23.3099, -51.1603, 1, 'Em Execução', '[{"date": "2024-01-15T10:00:00Z", "status": "Iniciado", "observation": "Equipe 1 iniciou trabalho"}]', 'rocagem'),

-- Capina e Roçagem - Lote 2
(6, 'area publica', 'Av Duque de Caxias', 'Zona Sul', 32145.67, -23.3367, -51.1534, 2, 'Pendente', '[]', 'rocagem'),
(7, 'canteiro', 'Av Inglaterra', 'Cinco Conjuntos', 11234.56, -23.3278, -51.1745, 2, 'Pendente', '[]', 'rocagem'),
(8, 'praça', 'Praça Maringá', 'Cervejaria', 8765.43, -23.3189, -51.1667, 2, 'Pendente', '[]', 'rocagem'),
(9, 'area publica', 'Parque Guanabara', 'Guanabara', 28765.43, -23.2989, -51.1823, 2, 'Em Execução', '[{"date": "2024-01-16T08:00:00Z", "status": "Iniciado"}]', 'rocagem'),

-- Jardins
(10, 'ROT', 'Av. Henrique Mansano x Av. Lucia Helena Gonçalves Vianna (Sanepar)', 'Jardim Botânico', 0, -23.282252, -51.155120, NULL, 'Pendente', '[]', 'jardins'),
(11, 'ROT', 'Av. Maringá x Rua Prof. Joaquim de Matos Barreto (Aterro Maior)', 'Aeroporto', 0, -23.324934, -51.176449, NULL, 'Pendente', '[]', 'jardins'),
(12, 'ROT', 'Praça Rocha Pombo', 'Vila Nova', 0, -23.314200, -51.157800, NULL, 'Pendente', '[]', 'jardins'),
(13, 'ROT', 'Parque Arthur Thomas', 'Nova Londrina', 0, -23.316700, -51.178900, NULL, 'Pendente', '[]', 'jardins');