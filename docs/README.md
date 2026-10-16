# Documentación — Estacionamiento COM 301

## Propuesta

[proposal.md](https://github.com/MagaIrisarri/TPDSW/blob/main/proposal.md): tema, modelo de dominio, DER y alcance (regularidad, aprobación y adicional).

## Pull requests

| Entrega | Backend | Frontend |
|---|---|---|
| Regularidad | https://github.com/MagaIrisarri/Backend/pulls | https://github.com/MagaIrisarri/Frontend/pulls |

## Instalación y ejecución

- Backend: [README](../README.md#instalación)
- Frontend: [README](https://github.com/MagaIrisarri/Frontend#instalación)

## Minutas de reunión y avance

| Fecha | Participantes | Temas | Acuerdos / próximos pasos |
|---|---|---|---|

## Seguimiento de features, bugs e issues
- **Metodología ágil: Kanban**, con flujo continuo y sin sprints de duración fija.
  - **Tablero visible:** cada ítem del alcance (CRUD, listado, CUU) es una tarjeta en Notion, agrupada por capa (backend y frontend), y pasa por pendiente, en curso y hecho.
  - **Trabajo en curso acotado:** cada integrante toma un ítem a la vez y lo cierra antes de empezar otro.
  - **Una rama por feature:** cada cambio se desarrolla en su rama y se integra con un Pull Request; el hash del commit queda anotado en la tarjeta.
  - **Mejora continua:** los bugs encontrados se registran con su commit en el tablero y se revisan en las reuniones (ver las minutas más abajo).
- Tablero: [Notion – TP alcance regularidad](https://app.notion.com/p/TP-alcance-regularidad-3ba3ff992fda8019ae50eb40bd1503de) (avance por capa, PRs asociados a cada ítem y registro de bugs resueltos)
- Issues: No se utilizaron issues de GitHub. Los bugs encontrados y resueltos, con sus commits, están registrados en el tablero de Notion (sección "Bugs encontrados y resueltos"). Pull requests: [Backend](https://github.com/MagaIrisarri/Backend/pulls?q=is%3Apr+state%3Aclosed) · [Frontend](https://github.com/MagaIrisarri/Frontend/pulls?q=is%3Apr+state%3Aclosed)


## Pruebas

[tests.md](tests.md): las pruebas de la cátedra (Backend y Frontend), cómo se corren y la salida de consola de cada corrida.

## Alcance y evidencia

El mapeo de cada requisito de la propuesta al código que lo cumple está en el repo Frontend: [revision-alcance.md](https://github.com/MagaIrisarri/Frontend/blob/master/docs/revision-alcance.md).
