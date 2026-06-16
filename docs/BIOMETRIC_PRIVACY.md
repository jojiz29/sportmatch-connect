# Biometric Privacy Policy

## Finalidad del tratamiento

En SportMatch Connect, la seguridad y confianza de nuestra comunidad es nuestra mayor prioridad. El tratamiento de los datos biométricos de los usuarios tiene las siguientes finalidades exclusivas:

- **Verificación de identidad:** Confirmar que la persona que crea y utiliza la cuenta es quien dice ser, garantizando la correspondencia de su identidad con su documento oficial.
- **Prevención de fraude:** Evitar la creación de perfiles falsos, la suplantación de identidad de deportistas o la duplicación fraudulenta de cuentas asociadas a un mismo documento de identidad.
- **Validación de usuarios reales:** Proveer un ecosistema confiable de emparejamiento deportivo (_matchmaking_) y reservas de canchas, protegiendo a la comunidad frente a actores maliciosos.

## Datos procesados

Durante el flujo de Verificación de DNI 2.0, se procesan únicamente los siguientes datos:

- **Documento Nacional de Identidad (DNI):** Foto frontal del documento oficial físico provista por el usuario.
- **Selfie de verificación:** Fotografía del rostro del usuario capturada en tiempo real con la cámara frontal.
- **Resultado de validación:** Los indicadores lógicos de consistencia devueltos por los modelos de IA (si el documento es legible, si el número de DNI coincide y si los rostros del documento y de la selfie corresponden al mismo individuo).
- **Timestamp de consentimiento:** Registro exacto de la fecha y hora en que el usuario otorgó su consentimiento explícito para el procesamiento de sus imágenes.

## Almacenamiento transitorio

La arquitectura técnica del módulo de verificación de SportMatch Connect ha sido diseñada bajo el principio de **privacidad por diseño**:

- **Almacenamiento temporal:** Las imágenes del DNI y la selfie se suben temporalmente a un repositorio seguro y aislado para ser analizadas por el motor multimodal de Vertex AI.
- **Eliminación inmediata:** Una vez completado el análisis y comparación de los rostros, el backend ejecuta un comando de purga que elimina físicamente y de manera definitiva ambos archivos del almacenamiento.
- **Sin copias permanentes:** SportMatch Connect **no** almacena, no respalda ni mantiene copias de las imágenes del documento DNI ni de la selfie de verificación bajo ninguna circunstancia.

## Consentimiento

El procesamiento de datos biométricos está estrictamente condicionado por la voluntad del usuario:

- **Consentimiento explícito obligatorio:** El usuario debe marcar activamente una casilla de consentimiento antes de poder iniciar el flujo de verificación. Sin esta aprobación, el sistema rechaza el procesamiento de las imágenes en cumplimiento de las normativas de seguridad.
- **Opt-in biométrico:** El proceso de verificación es opcional para el uso general de la plataforma, actuando como un mecanismo voluntario de mejora de la reputación digital (_trust score_).
- **Derecho de revocación:** El usuario tiene el derecho de solicitar la revocación del consentimiento otorgado a través de los canales de soporte autorizados (soporte@sportmatch.app). La revocación resultará en la eliminación del estado de verificación de la cuenta y sus registros persistidos asociados.

## Seguridad

Para garantizar la integridad y confidencialidad del proceso, se han implementado las siguientes medidas de seguridad técnicas:

- **Bucket privado:** Las imágenes transitorias se almacenan en el bucket privado e independiente `identity-documents` en Supabase Storage (no es de acceso público).
- **Controles de acceso a nivel de fila (RLS):** Se aplican políticas de seguridad estrictas que restringen la lectura, escritura y eliminación de objetos dentro del bucket, permitiendo únicamente al usuario autenticado interactuar con los archivos que se encuentran bajo su propia carpeta (`identity-documents/auth.uid()/*`).
- **Validación de propiedad de archivos (Mitigación IDOR):** El backend de NestJS valida rigurosamente que las rutas de almacenamiento enviadas por el cliente pertenezcan al ID del usuario autenticado que realiza la solicitud.
- **Protección contra inyecciones y Path Traversal:** Se rechazan todas las solicitudes con rutas de archivos que contengan esquemas absolutos (`http:`), secuencias de escape (`..`) o caracteres no autorizados.
- **Eliminación en bloque finally:** La llamada para eliminar las imágenes de Supabase Storage se encuentra encapsulada en un bloque `finally` en el backend, garantizando su ejecución incluso en situaciones donde el análisis con Vertex AI o la consulta RENIEC fallen inesperadamente.

## Cumplimiento normativo

La presente política de privacidad y el tratamiento de datos biométricos se rigen y cumplen estrictamente con lo estipulado en la:

- **Ley N° 29733 — Ley de Protección de Datos Personales de la República del Perú** y su correspondiente Reglamento (Decreto Supremo N° 003-2013-JUS).
- Los datos son tratados de conformidad con los principios de legalidad, consentimiento, finalidad, proporcionalidad, calidad, seguridad y nivel de protección adecuado de datos personales.

## Datos persistidos

Tras finalizar con éxito la verificación, los **únicos** registros que permanecen guardados en la tabla `profiles` de la base de datos de manera permanente son:

- `fecha_verificacion`: Fecha y hora en la que se completó con éxito el flujo de verificación.
- `consentimiento_bio`: Fecha y hora exactas en la que el usuario aceptó explícitamente la presente política de privacidad.
- `dni_hash`: Un hash criptográfico seguro e irreversible (SHA-256) del número de DNI, utilizado exclusivamente para evitar que un mismo documento físico sea verificado en múltiples cuentas. El número de DNI plano **no** se guarda.
- `dni_ai_confidence`: El puntaje de confianza decimal de la coincidencia facial devuelto por Vertex AI (por ejemplo, `0.95`), utilizado para auditorías internas de precisión del modelo.

> [!IMPORTANT]
> **SportMatch Connect NO conserva de forma permanente las imágenes de tu DNI ni de tu selfie.** Las fotos enviadas sirven únicamente para la validación instantánea de identidad y son eliminadas de forma inmediata de nuestros servidores.
