# CalangoSocial
**Calango Social** é uma rede social desenvolvida como projeto Fullstack utilizando **Angular**, **Spring Boot** e **PostgreSQL**. A aplicação permite que usuários se conectem, publiquem conteúdos, curtam, comentem e interajam de forma intuitiva, simulando uma rede social moderna.

---

## 🚀 Funcionalidades

-  Autenticação de usuários (login, cadastro, recuperacão de senha e persistência de sessão)
-  Criação de postagens com imagens, vídeos e descrição
-  Curtidas e comentários em posts
-  Perfil do usuário com foto, bio e visualização de atividades
-  Sistema de amizades (enviar, aceitar, rejeitar solicitações)
-  Feed com postagens de amigos
-  Notificações em tempo real (WebSocket)
-  Upload de imagens e vídeos com Firebase Storage  
   O backend em Spring Boot recebe o upload, envia a imagem para o Firebase Storage e armazena apenas o path da imagem no banco de dados PostgreSQL.

---

## Tecnologias Utilizadas

### Frontend
- [Angular](https://angular.io/)
- Angular Material
- RxJS
- Firebase (Storage, Realtime Database e Auth)

### Backend
- [Spring Boot](https://spring.io/projects/spring-boot)
- Spring Security
- Spring Data JPA
- PostgreSQL
- WebSocket (notificações)
* Repositório do Backend: https://github.com/EvertonFarias/Rede-Social/tree/main

