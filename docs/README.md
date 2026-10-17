# Documentación — Estacionamiento COM 301

## Propuesta

[proposal.md](https://github.com/MagaIrisarri/TPDSW/blob/main/proposal.md): tema, modelo de dominio, DER y alcance (regularidad, aprobación y adicional).

## Pull requests

| Entrega | Backend | Frontend |
|---|---|---|
| Regularidad |[Backend #9](https://github.com/MagaIrisarri/Backend/pull/10) | [Frontend #13](https://github.com/MagaIrisarri/Frontend/pull/14) | 

## Instalación y ejecución

- Backend: [README](../README.MD#instalación)
- Frontend: [README](https://github.com/MagaIrisarri/Frontend#instalación)

## Minutas de reunión y avance

| Fecha | Participantes | Temas | Acuerdos / próximos pasos |
|---|---|---|---|
| 18/04/2026 | Magali, Valentino, Mateo, Ariana | Revisión de la propuesta (Discord).<br>Reserva pasa a ser CUU, no CRUD.<br>Se unifican Cliente y Empleado en Usuario con roles (cliente, empleado y un administrador/dueño que registra el estacionamiento).<br>Al unificar quedan 3 CRUDs y se necesitan 4: se evalúan Lugares, Tipo de reserva, Vehículo, Servicios adicionales (lavado, inflado de ruedas) e Histórico de reservas.<br>Dudas: notificaciones, turnos mañana/tarde/noche, código de tipo de vehículo, código de turno de empleado. | Consultar las dudas al profesor en la clase del viernes 24/04 (todos).<br>Registrar los cambios propuestos en el canal de Discord creado por Valentino. |
| 26/04/2026 | Magali, Valentino, Mateo, Ariana | Ajustes al modelo de dominio a partir de la devolución del profesor:<br>• Facturas no es CRUD.<br>• Vehículo se relaciona con Reserva y no con Usuario.<br>• Servicio se relaciona con PrecioServicio, y PrecioServicio con Estacionamiento y con Reserva. | Actualizar proposal.md y el modelo con estos cambios. |
| 14/06/2026 | Magali, Valentino, Mateo, Ariana | CRUD de al menos una entidad (pedido en la clase del 12/06).<br>Valen comparte un repo de prueba (proy-estacionamiento-test).<br>Magali sube la CRUD de Usuario (sin validaciones) al repo de backend.<br>Reparto de CRUDs entre integrantes. | Mateo, Ariana y Valentino suben sus CRUDs al repo de backend.<br>Unificar todo una vez avanzadas las CRUDs.<br>Revisar error al actualizar en la versión de prueba. |
| 08/07/2026 | Magali, Valentino, Mateo, Ariana | Flujo de trabajo en GitHub indicado por el profesor: cada cambio en una rama, revisión por otro integrante y merge a la rama principal (main/master).<br>Magali sube: rama de front conectada al backend con validaciones, rama de back con la entidad Vehicle y rama de back que conecta Usuario con el front. | Revisar las ramas y, si funcionan, mergearlas a la principal (todos). |
| 25/08/2026 | Magali, Valentino, Mateo, Ariana | Planificación de la entrega de regularidad del 11/09. CRUDs en backend, frontend y base de datos: Usuario, Estacionamiento, Servicio, TipoVehículo, Vehículo (depende de TipoVehículo) y Ubicacion_playa (depende de Estacionamiento).<br>Valentino migra Usuario a MikroORM y asigna vehículo al cliente. | Completar las 6 CRUDs en las tres capas antes del 11/09.<br>Magali revisa la rama de Valentino. |
| 08/09/2026 | Magali, Valentino, Mateo, Ariana | División del frontend pendiente para no pisarse.<br>Avances: eliminar vehículos desde usuario, dashboard general del dueño, CRUD de cocheras en el panel de usuario.<br>Mapa con Leaflet; evaluar Google Maps para aprobación directa.<br>Manejo de tokens por sesión: se posterga.<br>Reglas pendientes: reducir capacidad, pasar a mantenimiento o eliminar una ubicación con reservas futuras. | Magali: front de modificar vehículo y CRUD de front de Ubicacion_playa.<br>Valentino: revisar faltantes del backend, dashboards por tipo de usuario e investigar API de mapas.<br>Reglas de capacidad/mantenimiento para la próxima entrega. |
| 12/09/2026 | Magali, Valentino, Mateo, Ariana | Revisión post-entrega.<br>Resuelto: mostrar servicio asignado, elegir dueño o cliente al registrarse, títulos en modo oscuro, validación de mayoría de edad.<br>Pendiente: validar reservas al pasar plaza a mantenimiento, extender panel de admin al resto de los roles, definir si la ubicación se asigna sola o la elige el usuario, panel de empleado (cambio de lugar), panel de dueño (alta de empleado), asignación inicial de plazas y reasignación de reservas.<br>Separación de roles: el dueño deja de ser cliente pero conserva el home con el mapa; mismo criterio para empleado. | Magali mergea a la rama principal.<br>Valentino descarta feature/parking-locations (desactualizada) e implementa la separación de roles.<br>Reenviar el link al profesor. |
| 14/10/2026 | Magali, Valentino, Mateo, Ariana | Preparación de la defensa.<br>Merge de la rama tipoVehiculo con prueba-valen. | Para main/master: dejar solo la documentación obligatoria, con los links de la cátedra.<br>Valen limpia main/master. |


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
