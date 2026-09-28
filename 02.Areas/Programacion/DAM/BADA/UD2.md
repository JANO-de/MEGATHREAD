# 2. Nacimiento de las Bases de Datos

Los problemas de los **sistemas de archivos** (duplicidad de información, inconsistencias, dependencia del formato, dificultad de acceso, poca seguridad y escasa concurrencia) hicieron evidente la necesidad de un nuevo enfoque: las **bases de datos**.

---

## 2.1 ¿Qué es una base de datos?

Una **base de datos (BD)** es un conjunto organizado de datos relacionados, almacenados de forma estructurada y con la mínima redundancia posible.

La gran diferencia frente a los sistemas de archivos es que la información **ya no se guarda en ficheros aislados**, sino que se **integra en un sistema común**, lo que permite relacionar fácilmente distintos tipos de datos.

![Base de datos](https://bbdd-apuntes.pages.dev/images/base_de_datos.jpg)

📌 **Ejemplo de base de datos con varias tablas:**

**Alumnos**

|**DNI**|**Nombre**|**Direccion**|**Fecha_Nacimiento**|
|---|---|---|---|
|2894512X|José Jiménez|Corredera, 34|21/10/1990|
|28924896D|Ana Torres|Picasso, 23|11/02/1991|

**Asignaturas**

|**Codigo_Asignatura**|**Nombre**|
|---|---|
|001|Matemáticas|
|002|Lengua|

**Notas**

|**DNI**|**Codigo_Asignatura**|**Nota**|
|---|---|---|
|2894512X|001|7|
|2894512X|002|8|
|28924896D|001|6|

De esta manera, toda la información queda **conectada** y no se repite innecesariamente.

---

## 2.2 Ventajas de las bases de datos

- **Menor redundancia** → los datos se almacenan una sola vez.
- **Mayor consistencia** → un cambio se refleja en todos los lugares donde se usa.
- **Independencia entre datos y programas** → el diseño de la BD puede cambiar sin reprogramar todo.
- **Mayor seguridad** → se definen usuarios y permisos específicos.
- **Acceso flexible** → es posible realizar consultas complejas sin reprogramar.
- **Concurrencia controlada** → varios usuarios pueden acceder al mismo tiempo.
- **Integridad** → el sistema impone reglas (ejemplo: no se pueden registrar notas de alumnos inexistentes).

---

## 2.3 Inconvenientes de las bases de datos

- **Mayor coste inicial**: requiere instalar y configurar un **SGBD**.
- **Complejidad técnica**: se necesita personal especializado (administradores, DBA).
- **Rendimiento en sistemas pequeños**: para tareas muy simples, un fichero puede ser más rápido que una BD.

---

## 2.4 Usos y aplicaciones de las bases de datos

Hoy en día, las bases de datos son la **columna vertebral** de casi todos los sistemas de información. Se utilizan en prácticamente todos los sectores:

- **Administración pública:** padrones municipales, censos, historia clínica digital.
- **Educación:** matrículas, expedientes, calificaciones.
- **Banca:** cuentas, movimientos, préstamos.
- **Comercio electrónico:** catálogos de productos, pedidos, envíos, pagos.
- **Internet:** redes sociales, buscadores, servicios de streaming.

![Diraya](https://bbdd-apuntes.pages.dev/images/diraya.jpg)

---

📌 **Ejemplo real:**

En una tienda online como **Amazon**, cada compra genera registros en varias tablas:

- **Clientes**
- **Productos**
- **Pedidos**
- **Pagos**
- **Envios**

Todo queda relacionado automáticamente, garantizando la trazabilidad y la coherencia.

![Base de datos grandota](https://bbdd-apuntes.pages.dev/images/BDD_grandota.png)

---

## 2.5 Buenas prácticas aprendidas:

De lo trabajado en este apartado, podemos extraer algunas buenas prácticas básicas a la hora de diseñar y utilizar bases de datos:

|Tema|Buena práctica|Ejemplo correcto|Ejemplo a evitar|
|---|---|---|---|
|**Nombres de tablas**|Usar nombres en **plural**, ya que una tabla contiene varios registros.|`Alumnos`, `Notas`, `Productos`.|`Alumno`, `Nota`, `Producto`.|
|**Nombres**|No se usan espacios, ni acentos, evitar utilizar iniciales.|`direccion`, `fechaNacimiento`, `fecha_nacimiento`, `codigoalumno`.|`Dirección`, `CodAlum`, `Fecha Nacimiento`.|
|**Nombres de campos**|Usar nombres en **singular**, claros y consistentes.|`dni`, `nombre`, `direccion`, `fechaNacimiento`.|`Nombres`, `Direcciones`, `Dato1`.|
|**Normalización de los nombres**|usa siempre la misma normalización.|Siempre guionesbajos, sin guiones, etc.|No intercambies entre nombres.|

Volver al principio