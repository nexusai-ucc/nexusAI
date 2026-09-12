# Introducción a las Bases de Datos Relacionales

## El modelo relacional

El modelo relacional organiza los datos en tablas (también llamadas relaciones),
donde cada fila es un registro y cada columna es un atributo. Una tabla
representa una entidad del dominio, como `Alumnos`, `Cursos` o `Pedidos`.

### Clave primaria

Una **clave primaria** (primary key) es un atributo, o un conjunto de
atributos, que identifica de forma única cada fila de una tabla. Dos filas de
la misma tabla nunca pueden tener el mismo valor de clave primaria. Además,
la clave primaria no puede tener valores NULL: todo registro debe tener un
identificador válido desde el momento en que se inserta. Es común usar un
campo numérico autoincremental (`id`) como clave primaria, aunque también se
puede usar una clave natural (por ejemplo, el DNI de una persona) si se
garantiza que es única y no nula.

### Clave foránea

Una **clave foránea** (foreign key) es un atributo en una tabla que referencia
la clave primaria de otra tabla, estableciendo una relación entre ambas. Por
ejemplo, la tabla `Pedidos` puede tener una columna `cliente_id` que referencia
`Clientes.id`. El motor de base de datos puede validar la integridad
referencial: no se puede insertar un pedido con un `cliente_id` que no exista
en la tabla `Clientes`.

## Comandos SQL para manipular datos y estructuras

### DELETE, TRUNCATE y DROP

Estos tres comandos eliminan datos, pero funcionan de forma muy distinta:

- **DELETE** es un comando DML (Data Manipulation Language). Elimina filas de
  una tabla según una condición `WHERE`. Es logueable fila por fila en la
  transacción, por lo que se puede revertir con `ROLLBACK` antes del
  `COMMIT`, y dispara los triggers `ON DELETE` si existen. Es más lento que
  `TRUNCATE` en tablas grandes porque el motor registra cada fila eliminada.
- **TRUNCATE** es un comando DDL (Data Definition Language). Elimina todas
  las filas de una tabla de una sola vez, sin registrar cada fila individual
  en el log de transacciones. Es mucho más rápido que un `DELETE` sin
  `WHERE`, pero en la mayoría de los motores no dispara triggers y reinicia
  los contadores de autoincremento.
- **DROP** elimina la tabla completa, incluyendo su estructura (columnas,
  índices, restricciones) y todos sus datos. Después de un `DROP TABLE`, la
  tabla deja de existir en el esquema; para volver a usarla hay que crearla
  de nuevo con `CREATE TABLE`.

En resumen: `DELETE` borra filas (DML, selectivo, reversible dentro de la
transacción), `TRUNCATE` vacía la tabla entera de forma rápida (DDL), y
`DROP` borra la tabla y su definición completa.

### JOIN interno y externo

Un **INNER JOIN** combina filas de dos tablas y devuelve únicamente las filas
donde existe coincidencia en ambas tablas según la condición de unión. Si un
cliente no tiene pedidos, ese cliente no aparece en el resultado de un INNER
JOIN entre `Clientes` y `Pedidos`.

Un **LEFT JOIN** (o LEFT OUTER JOIN) devuelve todas las filas de la tabla de
la izquierda, y para las filas donde no hay coincidencia en la tabla de la
derecha, completa esas columnas con NULL. Por ejemplo, un `LEFT JOIN` de
`Clientes` con `Pedidos` devuelve todos los clientes, incluso los que nunca
hicieron un pedido, mostrando NULL en las columnas de `Pedidos` para esos
casos. El RIGHT JOIN es el caso simétrico: devuelve todas las filas de la
tabla de la derecha, completando con NULL las columnas de la izquierda
cuando no hay coincidencia.

## Normalización

Las **formas normales** (1FN, 2FN, 3FN, BCNF) son un conjunto de reglas para
organizar las tablas de una base de datos relacional de forma que se
minimice la redundancia de datos y se eviten anomalías de inserción,
actualización y eliminación.

- **Primera Forma Normal (1FN):** cada celda de la tabla debe contener un
  valor atómico (no listas ni grupos repetitivos), y cada fila debe ser
  identificable de forma única.
- **Segunda Forma Normal (2FN):** la tabla debe estar en 1FN, y además todos
  los atributos que no son clave deben depender completamente de la clave
  primaria (no de solo una parte de una clave compuesta).
- **Tercera Forma Normal (3FN):** la tabla debe estar en 2FN, y además no
  puede haber dependencias transitivas: un atributo no clave no puede
  depender de otro atributo no clave, sino únicamente de la clave primaria.
- **BCNF (Boyce-Codd):** una versión más estricta de 3FN que elimina ciertas
  anomalías que 3FN no cubre, exigiendo que todo determinante funcional sea
  una clave candidata.

### Cuándo aplicar normalización

Si una tabla tiene muchas columnas redundantes (por ejemplo, repite el
nombre y la dirección del proveedor en cada fila de un pedido), el primer
paso para arreglarlo es aplicar normalización, empezando por asegurar la
1FN: eliminar los grupos repetitivos y garantizar que cada celda tenga un
único valor atómico. Una vez en 1FN, se puede avanzar a 2FN y 3FN separando
la información redundante en tablas relacionadas por clave foránea.

## Transacciones y propiedades ACID

Una **transacción** es una unidad lógica de trabajo compuesta por una o más
operaciones sobre la base de datos, que se ejecuta como un todo indivisible:
o se aplican todas sus operaciones, o no se aplica ninguna. Las
transacciones garantizan la consistencia de los datos incluso ante fallas
del sistema o accesos concurrentes.

Las propiedades **ACID** que debe cumplir toda transacción son:

- **Atomicidad:** todas las operaciones de la transacción se ejecutan
  completamente, o ninguna se ejecuta. Si una operación falla a mitad de
  camino, se revierten (`ROLLBACK`) todas las anteriores.
- **Consistencia:** la transacción lleva la base de datos de un estado
  válido a otro estado válido, respetando todas las restricciones de
  integridad definidas (claves, tipos, checks).
- **Aislamiento (Isolation):** las transacciones concurrentes no deben
  interferir entre sí; el resultado de ejecutar varias transacciones en
  paralelo debe ser equivalente a ejecutarlas en algún orden secuencial.
- **Durabilidad:** una vez que una transacción hace `COMMIT`, sus cambios
  persisten incluso si el sistema falla inmediatamente después (por
  ejemplo, un corte de energía).

### Concurrencia entre transacciones

Cuando dos transacciones intentan modificar el mismo registro al mismo
tiempo, pueden aparecer problemas de concurrencia como el **lost update**
(una transacción sobrescribe el cambio de otra sin darse cuenta) o el
**dirty read** (una transacción lee un dato modificado por otra que todavía
no hizo `COMMIT`). Para evitar estas inconsistencias, los sistemas gestores
de bases de datos (SGBD) usan mecanismos de control de concurrencia, como:

- **Locks (bloqueos):** una transacción bloquea una fila o tabla mientras la
  modifica, y otras transacciones deben esperar a que se libere el bloqueo.
- **MVCC (Multiversion Concurrency Control):** el motor mantiene varias
  versiones de una misma fila, de forma que las lecturas no bloquean a las
  escrituras ni viceversa; cada transacción ve una "foto" consistente de los
  datos según su nivel de aislamiento.

El nivel de aislamiento configurado (READ COMMITTED, REPEATABLE READ,
SERIALIZABLE, entre otros) determina qué tan estrictamente se previenen
estos problemas, a costa de mayor o menor concurrencia real.

## Índices

Un **índice** es una estructura de datos auxiliar (típicamente un árbol
B-Tree o un hash) que el motor de base de datos mantiene sobre una o más
columnas de una tabla, para acelerar las búsquedas sin tener que recorrer
todas las filas.

### Cuándo conviene usar un índice

Los índices aceleran mucho las consultas que filtran o unen por columnas muy
consultadas, especialmente en cláusulas `WHERE` y `JOIN`, y en columnas
usadas para ordenar (`ORDER BY`). Por ejemplo, indexar `cliente_id` en la
tabla `Pedidos` acelera enormemente las búsquedas de "todos los pedidos de
un cliente".

### Cuándo un índice puede ser contraproducente

Un índice no siempre conviene. Puede ser contraproducente en estos casos:

- **Tablas muy pequeñas:** el motor puede tardar más en usar el índice que
  en recorrer la tabla completa (full scan).
- **Columnas con pocos valores distintos** (baja cardinalidad, como una
  columna booleana `activo`): el índice aporta poca selectividad y el motor
  puede preferir ignorarlo.
- **Tablas con escrituras muy frecuentes:** cada `INSERT`, `UPDATE` o
  `DELETE` obliga a actualizar también el índice, lo que agrega overhead.
  Tener muchos índices en una tabla con alta tasa de escritura puede
  degradar el rendimiento general.

Por eso, la recomendación general es indexar las columnas que se consultan
mucho y se escriben poco, evitando indexar todo "por las dudas".
