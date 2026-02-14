/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.3-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: fightevo_DB
-- ------------------------------------------------------
-- Server version	11.8.3-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `ACADEMIAS`
--

DROP TABLE IF EXISTS `ACADEMIAS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ACADEMIAS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(255) DEFAULT NULL,
  `logradouro` varchar(255) DEFAULT NULL,
  `cep` varchar(20) DEFAULT NULL,
  `bairro` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `federacao_id` int(11) DEFAULT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `federacao_id` (`federacao_id`),
  KEY `responsavel_id` (`responsavel_id`),
  CONSTRAINT `ACADEMIAS_ibfk_1` FOREIGN KEY (`federacao_id`) REFERENCES `FEDERACOES` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ACADEMIAS_ibfk_2` FOREIGN KEY (`responsavel_id`) REFERENCES `USUARIOS` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ACADEMIAS`
--

LOCK TABLES `ACADEMIAS` WRITE;
/*!40000 ALTER TABLE `ACADEMIAS` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `ACADEMIAS` VALUES
(1,'IFC Life Brothers BJJ','11.447.192/0001-03','Rua Antonio João de Medeiros, 124 C/1','08140-060','Itaim Paulista','São Paulo','SP','11 98856-1003','carlosmaiolino@hotmail.com',1,2,'2025-10-23 23:15:57','2025-10-23 23:15:57');
/*!40000 ALTER TABLE `ACADEMIAS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `ATLETAS`
--

DROP TABLE IF EXISTS `ATLETAS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ATLETAS` (
  `id` int(11) NOT NULL,
  `nome_completo` varchar(255) NOT NULL,
  `data_nascimento` date NOT NULL,
  `rg` varchar(50) DEFAULT NULL,
  `cpf` varchar(20) NOT NULL,
  `logradouro` varchar(255) DEFAULT NULL,
  `cep` varchar(20) DEFAULT NULL,
  `bairro` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `telefone_contato` varchar(20) DEFAULT NULL,
  `foto_url` varchar(1024) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  CONSTRAINT `ATLETAS_ibfk_1` FOREIGN KEY (`id`) REFERENCES `USUARIOS` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ATLETAS`
--

LOCK TABLES `ATLETAS` WRITE;
/*!40000 ALTER TABLE `ATLETAS` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `ATLETAS` VALUES
(3,'ALEXANDRE RIBEIRO DA SILVA','1972-11-20','20804777-3','19481938840','Rua Pacutinga, 5','08120-360','Itaim Paulista','São Paulo','SP','+5511983355410','foto-1761261792582-894276613.jpg','2025-10-23 23:22:55','2025-10-23 23:23:12');
/*!40000 ALTER TABLE `ATLETAS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `DOCUMENTOS`
--

DROP TABLE IF EXISTS `DOCUMENTOS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DOCUMENTOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filiacao_id` int(11) NOT NULL,
  `tipo_documento` enum('atestado_medico','certificado_graduacao','rg_frente','rg_verso','comprovante_residencia','outro') NOT NULL,
  `url_arquivo` varchar(1024) NOT NULL,
  `nome_original` varchar(255) NOT NULL,
  `status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
  `data_upload` datetime NOT NULL DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `filiacao_id` (`filiacao_id`),
  CONSTRAINT `DOCUMENTOS_ibfk_1` FOREIGN KEY (`filiacao_id`) REFERENCES `FILIACOES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DOCUMENTOS`
--

LOCK TABLES `DOCUMENTOS` WRITE;
/*!40000 ALTER TABLE `DOCUMENTOS` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `DOCUMENTOS` VALUES
(1,1,'certificado_graduacao','documento-1761262381021-743296439.jpg','GB_Cert_Azul003.jpg','aprovado','2025-10-23 23:33:01','2025-10-23 23:33:01','2025-10-23 23:35:10'),
(2,1,'atestado_medico','documento-1761262395163-284086844.jpg','atestado_medico.jpg','aprovado','2025-10-23 23:33:15','2025-10-23 23:33:15','2025-10-23 23:35:11'),
(3,1,'rg_frente','documento-1761262409492-509897406.jpg','RG_Alexandre-Silva004.jpg','aprovado','2025-10-23 23:33:29','2025-10-23 23:33:29','2025-10-23 23:35:11'),
(4,1,'comprovante_residencia','documento-1761262433989-654780439.pdf','comprovante_de_residencia.pdf','aprovado','2025-10-23 23:33:53','2025-10-23 23:33:53','2025-10-23 23:35:12');
/*!40000 ALTER TABLE `DOCUMENTOS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `FEDERACOES`
--

DROP TABLE IF EXISTS `FEDERACOES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FEDERACOES` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(255) DEFAULT NULL,
  `logradouro` varchar(255) DEFAULT NULL,
  `cep` varchar(20) DEFAULT NULL,
  `bairro` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `representante_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `representante_id` (`representante_id`),
  CONSTRAINT `FEDERACOES_ibfk_1` FOREIGN KEY (`representante_id`) REFERENCES `USUARIOS` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FEDERACOES`
--

LOCK TABLES `FEDERACOES` WRITE;
/*!40000 ALTER TABLE `FEDERACOES` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `FEDERACOES` VALUES
(1,'CONFBEC - CONFEDERACAO BRASILEIRA DE ESPORTES DE CONTATO','10.921.076/0001-03','Rua Capoaba, 19 ','08341-230','Parque Boa Esperança','São Paulo','SP','11 98856-1003','carlosmaiolino@hotmail.com',2,'2025-10-23 23:14:11','2025-10-23 23:14:11');
/*!40000 ALTER TABLE `FEDERACOES` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `FILIACOES`
--

DROP TABLE IF EXISTS `FILIACOES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FILIACOES` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atleta_id` int(11) NOT NULL,
  `academia_id` int(11) NOT NULL,
  `modalidade_id` int(11) NOT NULL,
  `graduacao_id` int(11) NOT NULL,
  `professor_id` int(11) DEFAULT NULL,
  `status` enum('pendente_documentos','pendente_aprovacao_docs','pendente_aprovacao_professor','pendente_pagamento','ativo','rejeitado','inativo') NOT NULL DEFAULT 'pendente_documentos',
  `data_solicitacao` date NOT NULL,
  `data_aprovacao` date DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `atleta_id` (`atleta_id`),
  KEY `academia_id` (`academia_id`),
  KEY `modalidade_id` (`modalidade_id`),
  KEY `graduacao_id` (`graduacao_id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `FILIACOES_ibfk_1` FOREIGN KEY (`atleta_id`) REFERENCES `ATLETAS` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FILIACOES_ibfk_2` FOREIGN KEY (`academia_id`) REFERENCES `ACADEMIAS` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FILIACOES_ibfk_3` FOREIGN KEY (`modalidade_id`) REFERENCES `MODALIDADES` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FILIACOES_ibfk_4` FOREIGN KEY (`graduacao_id`) REFERENCES `GRADUACOES` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FILIACOES_ibfk_5` FOREIGN KEY (`professor_id`) REFERENCES `USUARIOS` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FILIACOES`
--

LOCK TABLES `FILIACOES` WRITE;
/*!40000 ALTER TABLE `FILIACOES` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `FILIACOES` VALUES
(1,3,1,1,6,2,'pendente_aprovacao_professor','2025-10-23',NULL,NULL,'2025-10-23 23:24:04','2025-10-23 23:35:16');
/*!40000 ALTER TABLE `FILIACOES` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `GRADUACOES`
--

DROP TABLE IF EXISTS `GRADUACOES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GRADUACOES` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `restricao_idade` varchar(100) DEFAULT NULL,
  `ordem` int(11) DEFAULT 0,
  `modalidade_id` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `modalidade_id` (`modalidade_id`),
  CONSTRAINT `GRADUACOES_ibfk_1` FOREIGN KEY (`modalidade_id`) REFERENCES `MODALIDADES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GRADUACOES`
--

LOCK TABLES `GRADUACOES` WRITE;
/*!40000 ALTER TABLE `GRADUACOES` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `GRADUACOES` VALUES
(1,'Faixa Branca','0',1,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(2,'Faixa Cinza','7',2,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(3,'Faixa Amarela','7',3,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(4,'Faixa Laranja','10',4,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(5,'Faixa Verde','13',5,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(6,'Faixa Azul','16',6,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(7,'Faixa Roxa','16',7,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(8,'Faixa Marrom','18',8,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(9,'Faixa Preta','19',9,1,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(10,'Faixa Branca','0',1,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(11,'Faixa Cinza','7',2,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(12,'Faixa Amarela','7',3,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(13,'Faixa Laranja','10',4,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(14,'Faixa Verde','13',5,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(15,'Faixa Azul','16',6,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(16,'Faixa Roxa','16',7,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(17,'Faixa Marrom','18',8,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(18,'Faixa Preta','19',9,2,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(19,'Faixa Branca','0',1,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(20,'Faixa Amarela','7',2,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(21,'Faixa Laranja','10',3,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(22,'Faixa Verde','13',4,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(23,'Faixa Azul','16',5,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(24,'Faixa Marrom','18',6,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(25,'Faixa Preta','19',7,3,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(26,'Branca Vermelha (1º Khan)',NULL,1,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(27,'Vermelho (2º Khan)',NULL,2,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(28,'Vermelho Azul Claro (3º Khan)',NULL,3,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(29,'Azul Claro (4º Khan)',NULL,4,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(30,'Azul Claro Azul Escuro (5º Khan)',NULL,5,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(31,'Azul Escuro (6º Khan)',NULL,6,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(32,'Azul Escuro Preta (7º Khan)',NULL,7,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(33,'Preto (8º Khan)',NULL,8,4,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(34,'Amador','0',1,5,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(35,'Profissional','0',2,5,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(36,'Faixa Branca','0',1,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(37,'Faixa Cinza','7',2,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(38,'Faixa Amarela','7',3,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(39,'Faixa Laranja','10',4,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(40,'Faixa Verde','13',5,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(41,'Faixa Azul','16',6,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(42,'Faixa Roxa','16',7,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(43,'Faixa Marrom','18',8,6,'2025-10-23 21:03:19','2025-10-23 21:03:19'),
(44,'Faixa Preta','19',9,6,'2025-10-23 21:03:19','2025-10-23 21:03:19');
/*!40000 ALTER TABLE `GRADUACOES` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `METODO_PAGAMENTOS`
--

DROP TABLE IF EXISTS `METODO_PAGAMENTOS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `METODO_PAGAMENTOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `taxa_filiacao` decimal(10,2) NOT NULL DEFAULT 0.00,
  `configuracao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuracao`)),
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `METODO_PAGAMENTOS`
--

LOCK TABLES `METODO_PAGAMENTOS` WRITE;
/*!40000 ALTER TABLE `METODO_PAGAMENTOS` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `METODO_PAGAMENTOS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `MODALIDADES`
--

DROP TABLE IF EXISTS `MODALIDADES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `MODALIDADES` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MODALIDADES`
--

LOCK TABLES `MODALIDADES` WRITE;
/*!40000 ALTER TABLE `MODALIDADES` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `MODALIDADES` VALUES
(1,'Jiu-Jitsu','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(2,'Grappling','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(3,'Kickboxing','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(4,'Muay Thai','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(5,'Boxe','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(6,'MMA','2025-10-23 21:03:19','2025-10-23 21:03:19');
/*!40000 ALTER TABLE `MODALIDADES` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `NOTICIAS`
--

DROP TABLE IF EXISTS `NOTICIAS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `NOTICIAS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `subtitulo` text DEFAULT NULL,
  `conteudo` text NOT NULL,
  `imagem_url` varchar(1024) DEFAULT NULL,
  `autor_id` int(11) DEFAULT NULL,
  `publicada_em` datetime NOT NULL DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `autor_id` (`autor_id`),
  CONSTRAINT `NOTICIAS_ibfk_1` FOREIGN KEY (`autor_id`) REFERENCES `USUARIOS` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NOTICIAS`
--

LOCK TABLES `NOTICIAS` WRITE;
/*!40000 ALTER TABLE `NOTICIAS` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `NOTICIAS` VALUES
(1,'World Cup Argentina 2025','INSCREVA - SE !!!','ATENÇÃO!!!\n\nA INSCRIÇÃO ENCERRA DIA 20/10/2025\n\nVALOR DA INSCRIÇÃO PARTICIPAÇÃO COPA DO MUNDO\n\nR$ 390,00 OU 70 dolartes Americanos + IOF\n\nVALOR DA INSCRIÇÃO COM HOMOLOGAÇÃO DO TÍTULO\n\nR$ 720,00 OU 120 dólares Americanos + IOF\n\n \n\nOBS: Pagamento via PIX ou em espécie na sede da Confederação Brasileira de Esportes de Contato até 20/10\n\nChave PIX: 10.921.076/0001-03\n\nBanco Cora - Confbec','https://yata-apix-0218abba-a269-42a8-9e17-b11aeb548917.s3-object.locaweb.com.br/fcec3b83a90940848a900f3ce034f067.jpg',1,'2025-10-23 22:41:06','2025-10-23 22:41:06','2025-10-23 22:41:34');
/*!40000 ALTER TABLE `NOTICIAS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `PAGAMENTOS`
--

DROP TABLE IF EXISTS `PAGAMENTOS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PAGAMENTOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filiacao_id` int(11) NOT NULL,
  `metodo_pagamento_id` int(11) DEFAULT NULL,
  `valor_pago` decimal(10,2) NOT NULL,
  `status` enum('pendente','pago','falhou','reembolsado') NOT NULL DEFAULT 'pendente',
  `id_transacao_gateway` varchar(255) DEFAULT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `qr_code_pix` text DEFAULT NULL,
  `linha_digitavel_boleto` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_transacao_gateway` (`id_transacao_gateway`),
  KEY `filiacao_id` (`filiacao_id`),
  KEY `metodo_pagamento_id` (`metodo_pagamento_id`),
  CONSTRAINT `PAGAMENTOS_ibfk_1` FOREIGN KEY (`filiacao_id`) REFERENCES `FILIACOES` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `PAGAMENTOS_ibfk_2` FOREIGN KEY (`metodo_pagamento_id`) REFERENCES `METODO_PAGAMENTOS` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PAGAMENTOS`
--

LOCK TABLES `PAGAMENTOS` WRITE;
/*!40000 ALTER TABLE `PAGAMENTOS` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `PAGAMENTOS` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `USUARIOS`
--

DROP TABLE IF EXISTS `USUARIOS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `USUARIOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('atleta','professor','treinador','admin') NOT NULL DEFAULT 'atleta',
  `nome` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USUARIOS`
--

LOCK TABLES `USUARIOS` WRITE;
/*!40000 ALTER TABLE `USUARIOS` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `USUARIOS` VALUES
(1,'confbecadmin@gmail.com','$2b$10$UnZ/iNttyZSMSYv3hatHhua0VbGk.PsqJnW9VWXg/MOk/DZDrjV.y','admin','Administrador CONFBEC','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(2,'carlos@maiolino.com','$2b$10$9uYNrKaU1dl/tRMNCNOAY.WU8N7bFSQ74nmpfaYpEk3CMLRy.HC1m','professor','Carlos Alberto Maiolino','2025-10-23 21:03:19','2025-10-23 21:03:19'),
(3,'alexribs@gmail.com','$2b$10$gdI6FxGqBEboS8Qjd6IX6.qyXSBxMB7genDXTfYf3kpbYSrlSJ5cy','atleta',NULL,'2025-10-23 23:16:20','2025-10-23 23:16:20');
/*!40000 ALTER TABLE `USUARIOS` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-10-24  0:52:30
