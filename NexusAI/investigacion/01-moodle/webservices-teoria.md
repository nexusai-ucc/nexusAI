# Web Services de Moodle: Teoría, Arquitectura e Integración

> **Resumen (3 líneas):** Los Web Services de Moodle exponen la lógica de negocio del LMS a sistemas externos mediante una arquitectura de tres capas y un patrón obligatorio de tres métodos por función. Documentan los protocolos disponibles (REST, SOAP, XML-RPC), el modelo de seguridad basado en tokens, los casos de integración empresarial (ERP, CRM, apps móviles) y el subsistema IA nativo introducido en Moodle 4.5. Es la base teórica para entender por qué `local_nexusai` implementa el Hybrid PHP Proxy.

---

## Contexto

Un LMS moderno no puede operar como silo aislado. Universidades y empresas requieren que Moodle se integre con sistemas de Recursos Humanos, ERPs, CRMs y plataformas móviles. El framework de Web Services de Moodle es la infraestructura que hace posible esta interoperabilidad, permitiendo a aplicaciones externas ejecutar operaciones de negocio con la misma seguridad que un usuario autenticado.

---

## Arquitectura de tres capas

La robustez y seguridad de la API de Moodle se sustenta en una separación estricta de responsabilidades conocida como **3-Layer Architecture**.

```
┌─────────────────────────────────────────────┐
│  1. External Server Interface               │  ← Única capa expuesta a la red
│     REST / SOAP / XML-RPC                   │  ← Autentica, parsea, emula sesión
├─────────────────────────────────────────────┤
│  2. Public PHP API                          │  ← Lógica de negocio + validación
│     (extiende external_api)                 │  ← Verifica capacidades y tipos
├─────────────────────────────────────────────┤
│  3. Low Level Internal API                  │  ← Operaciones atómicas en DB
│     ($DB->insert_record, etc.)              │  ← Sin validación (confía en capa 2)
└─────────────────────────────────────────────┘
```

**Capa 1 — External Server Interface:** Actúa como traductor y controlador de acceso perimetral. Gestiona el token de seguridad, desempaqueta la solicitud de red y **emula una sesión de usuario virtual** (sin emitir cookies reales — usa `NO_MOODLE_COOKIES` internamente). Así el entorno de Moodle opera como si el usuario propietario del token hubiera iniciado sesión.

**Capa 2 — Public PHP API:** Aquí reside la lógica de negocio. Esta capa implementa el **patrón de tres métodos** (ver sección siguiente) y verifica capacidades RBAC antes de ejecutar cualquier operación. Tiene prohibido acceder a superglobales (`$_POST`, `$_GET`) — todos los datos ingresan por argumentos formales de función.

**Capa 3 — Low Level Internal API:** Velocidad pura. Asume que todos los datos vienen validados de la capa superior; no realiza verificaciones de capacidades ni de parámetros.

---

## El patrón de diseño obligatorio: tres métodos

Toda función de servicio web extiende `\core_external\external_api` e implementa exactamente tres métodos estáticos.

```php
class mi_funcion extends external_api {

    // Método 1: Define la topología de parámetros de entrada y sus tipos
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'ID del curso'),
            'message'  => new external_value(PARAM_TEXT, 'Texto del mensaje'),
        ]);
    }

    // Método 2: Lógica real (PRIMERA instrucción: validate_parameters)
    public static function execute(int $courseid, string $message): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'message'  => $message,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:usechat', $context);

        // ... lógica de negocio ...
        return ['result' => 'ok'];
    }

    // Método 3: Define la morfología de la respuesta (filtro de salida)
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'result' => new external_value(PARAM_TEXT, 'Estado de la operación'),
        ]);
    }
}
```

`execute_parameters()` genera documentación dinámica de la API y crea una barrera infranqueable contra inyecciones. `execute_returns()` purifica la salida vía `external_api::clean_return_value()` — ninguna estructura interna se filtra a la red.

---

## Protocolos de transporte

| Protocolo | Formato | Rendimiento | Estado actual |
|---|---|---|---|
| **REST** | JSON, XML, texto plano | Óptimo — payloads livianos, stateless, escala horizontal | **Estándar dominante.** Implementaciones modernas retornan JSON |
| **SOAP** | XML exclusivamente (Envelopes rígidos) | Inferior — sobrecarga XML, mayor ancho de banda, tiende a retener estado | Legacy. Usado en integraciones .NET/Java corporativas por su tipado estático |
| **XML-RPC** | XML para invocación de procedimientos | Muy bajo. Alto costo computacional incluso para operaciones triviales | **Obsoleto.** Soporte nativo eliminado del core en Moodle 4.1 LTS |

La superioridad técnica de REST radica en su ligereza y compatibilidad nativa con tecnologías web modernas (React, Flutter, Python `requests`). Evita la serialización/deserialización que imponía SOAP.

---

## Modelo de seguridad: tokens, contextos y control operativo

La accesibilidad a este entorno programático requiere un mecanismo de seguridad riguroso. Los Web Services de Moodle no permiten consumo anónimo — se basan en la emisión, delegación y revocación de tokens criptográficos.

Un **token de servicio web** es una cadena generada criptográficamente que sustituye la necesidad de transmitir usuario/contraseña en cada solicitud.

### Cuatro controles sobre los tokens

1. **Autorización basada en capacidades:** Solo cuentas con la capacidad sistémica `moodle/webservice:createtoken` pueden generar tokens. Los roles estudiantiles no la tienen por defecto.

2. **Protección de cuentas privilegiadas:** Moodle impide que los administradores del sitio generen tokens para sí mismos desde el panel de control. Un token de administrador debe ser forzado manualmente por otro administrador con derechos suficientes — previene escalada de privilegios accidental.

3. **Restricciones de red y tiempo:** Los tokens pueden encapsularse dentro de rangos de direcciones IP específicas (un token robado no puede usarse desde fuera de la red autorizada) y tienen ventanas de vigencia temporal.

4. **Aislamiento de autenticación:** Se recomienda crear **cuentas de servicio** dedicadas, asignándoles el complemento `webservice` que bloquea completamente el inicio de sesión convencional a la interfaz gráfica. La cuenta existe exclusivamente para consumo de APIs.

---

## Casos de integración empresarial

### ERP y Recursos Humanos (SAP, Oracle, Microsoft Dynamics)

En entornos universitarios y corporativos, el sistema de RRHH es la *Source of Truth*. Los Web Services permiten:

- **Aprovisionamiento automático de identidades:** cuando un alumno se matricula, el sistema de RRHH llama `core_user_create_users` y lo agrega a la cohorte correspondiente (`core_cohort_add_cohort_members`).
- **Transferencia bidireccional de desempeño:** una vez que el usuario completa un curso crítico (ej. seguridad industrial), el ERP consulta `core_completion_get_course_completion_status` y actualiza el expediente del empleado en SAP o Workday.

### CRM y E-Commerce (Salesforce, HubSpot, Magento)

- **Ciclo de adquisición y matriculación:** cuando un prospecto abona en el e-commerce, el sistema de ventas emite una solicitud REST a Moodle creando al usuario y matriculándolo instantáneamente.
- **Analítica de marketing:** Salesforce consume datos de progreso del alumno y ejecuta campañas automatizadas sugiriendo contenidos avanzados.

### App Móvil Oficial de Moodle

La app móvil es un cliente externo sofisticado que depende completamente de los Web Services preconstruidos. Para autenticación con QR, solicita un token efímero con validez de 10 minutos que solo funciona desde la misma IP que originó la solicitud — nivel de seguridad adaptado a la naturaleza transitoria de las conexiones móviles.

---

## El Subsistema IA de Moodle 4.5+

Con Moodle 4.5 LTS se introduce el **Subsistema de Inteligencia Artificial**, que no integra modelos directamente sino que opera como puente estandarizado hacia proveedores externos.

### Tres entidades estructurales

1. **Placements (Ubicaciones):** Determinan dónde aparecen las herramientas cognitivas en la interfaz (editor TinyMCE, redacción de foros, generación de resúmenes de curso).

2. **Actions (Acciones):** Definen el alcance semántico de lo que el motor IA puede hacer: `generate_text`, `summarise_text`, `generate_image`. Este nivel de granularidad permite a los administradores restringir acciones en contextos de evaluación estricta (evita uso no ético durante exámenes).

3. **Providers (Proveedores):** Constituyen el nexo de transmisión subyacente. Los proveedores nativos conectan con OpenAI, Microsoft Azure AI, Ollama y Groq — garantizando agnosticismo respecto al proveedor.

### Limitación fundamental

El subsistema nativo expone actualmente capacidades orientadas a **transacciones atómicas e inmediatas** (solicitud-respuesta). Carece de un estado de "memoria conversacional" que permita mantener un hilo deductivo a lo largo del semestre. Esta limitación funcional del core es la justificación arquitectónica principal para desarrollar `local_nexusai` como plugin personalizado.

---

## Vinculación con NexusAI: consumo inverso de Web Services

El plugin `local_nexusai` no solo *expone* funciones web — también las **consume** para extraer el material del curso durante la fase de indexación RAG.

El flujo de ingesta inversa:

1. El administrador activa Web Services con protocolo REST en Moodle y genera un token permanente para uso del servidor FastAPI.
2. El motor Python ejecuta rutinas programadas invocando `core_course_get_contents` para obtener la jerarquía pedagógica del curso.
3. El script itera recursivamente sobre secciones, módulos y contenidos, detectando metadatos de extensión PDF.
4. Al hallar la URL del documento, adjunta el token criptográfico al hipervínculo y descarga el archivo binario para ingestión y segmentación analítica.

```python
import requests

MOODLE_URL = "https://moodle.universidad.edu"
TOKEN      = "token_del_servidor_fastapi"

def obtener_contenidos_curso(course_id: int) -> list:
    params = {
        'wstoken':           TOKEN,
        'wsfunction':        'core_course_get_contents',
        'moodlewsrestformat': 'json',
        'courseid':          course_id,
    }
    response = requests.post(
        f"{MOODLE_URL}/webservice/rest/server.php",
        data=params
    ).json()

    pdfs = []
    for section in response:
        for module in section.get('modules', []):
            for content in module.get('contents', []):
                if content.get('filename', '').endswith('.pdf'):
                    pdfs.append({
                        'url':      f"{content['fileurl']}&token={TOKEN}",
                        'filename': content['filename'],
                        'module':   module['id'],
                    })
    return pdfs
```

La latencia generada por el pipeline de ingestión (1.5–5 segundos) es imperceptible al usuario final gracias a la implementación de SSE — ver `../05-backend-fastapi/sse-streaming.md`.

---

## Decisiones tomadas para NexusAI

- **REST + JSON** como protocolo de comunicación — sin SOAP, sin XML-RPC.
- **Cuentas de servicio dedicadas** para el token de ingesta (no usar cuentas de docentes activos).
- **No habilitar Web Services en el MVP** para la comunicación Moodle → FastAPI: el plugin actúa como proxy interno y no requiere tokens externos.
- **Subsistema IA 4.5+ descartado para el MVP:** no soporta flujos conversacionales persistentes con historial de semestre — el plugin `local_nexusai` es la alternativa arquitectónica correcta.

## Abierto / pendiente

- [ ] Confirmar si la versión de Moodle de la UCC (≥4.5) tiene habilitado el subsistema IA.
- [ ] Definir con el área de IT universitario el proceso de habilitación de Web Services y restricciones IP para el token de ingesta.
- [ ] Evaluar activar Web Services REST en la instancia de Moodle solo para el token de ingesta (no para chat).

## Referencias

- [Moodle — External Services (5.0)](https://moodledev.io/docs/5.0/apis/subsystems/external)
- [Moodle — Web services FAQ](https://docs.moodle.org/4x/sv/Web_services_FAQ)
- [Moodle — External services security](https://docs.moodle.org/dev/External_services_security)
- [Moodle — AI Subsystem (4.5)](https://moodledev.io/docs/4.5/apis/subsystems/ai)
- [Moodle — Using web services](https://docs.moodle.org/en/Using_web_services)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
