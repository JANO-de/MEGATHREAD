# INDEX


# 1. Los sistemas de almacenamiento de la información.

En cualquier organización —ya sea una empresa, un instituto, un hospital o una administración pública— se genera diariamente una enorme cantidad de información: datos de clientes, expedientes de alumnos, facturas, productos, historiales médicos, etc.

La forma en que almacenamos y gestionamos esa información ha ido evolucionando con el tiempo. Pasamos de sistemas totalmente **manuales** (basados en papel y lápiz) a sistemas **informatizados de archivos** y, finalmente, a las **bases de datos modernas**, que son la base de los sistemas de información actuales.

---

## 1.1 Sistemas manuales: papel y lápiz

![Archivador](https://bbdd-apuntes.pages.dev/images/archivador.png)

Durante siglos, la única manera de conservar la información era **anotarla en papel**.

Los registros contables, los censos, los expedientes académicos o los historiales médicos se guardaban en libros, carpetas o archivadores.

### Ventajas

- Muy sencillo de implementar: basta con tener papel, bolígrafo y un archivador.
- Coste inicial bajo.

### Inconvenientes

- Mantenimiento complicado y lento.
- Acceso poco ágil: encontrar un dato específico requería revisar decenas de páginas.
- Duplicidad de información y riesgo de errores al copiar datos.
- Fragilidad: incendios, inundaciones o el simple paso del tiempo podían destruir los documentos.

📌 **Ejemplo:**  
En un colegio, las notas de los alumnos se escribían en un libro de calificaciones.  
Consultar el expediente completo de un alumno significaba buscar a mano entre montones de páginas, con el riesgo de equivocarse o de que algún documento se hubiera perdido.

---

## 1.2 Sistemas informatizados de archivos

Con la llegada de los **ordenadores en los años 70 y 80**, la información empezó a guardarse en **ficheros digitales**. Estos podían ser ficheros de texto, binarios o bases rudimentarias de datos.

- Cada fichero solía contener información de un único tema (por ejemplo: alumnos, asignaturas, matrículas).
- Para poder acceder y modificar los datos era necesario un **programa específico** que conociera el formato del fichero.

📌 **Ejemplo de ficheros:**

**alumnos.txt**

|**DNI**|**Nombre**|**Dirección**|
|---|---|---|
|2894512X|José Jiménez|C/ Corredera, 34|
|28924896D|Alejandra Gómez|C/ Picasso, 23|

**notas.txt**

|DNI|Asignatura|Nota|
|---|---|---|
|2894512X|Matemáticas|7|
|2894512X|Lengua|8|
|28924896D|Inglés|5|

---

![Archivos digitales](https://bbdd-apuntes.pages.dev/images/archivos.png)

Si un profesor quería saber todas las notas de un alumno, debía buscar su **DNI en `alumnos.txt`** y luego recorrer **todo `notas.txt`** para localizar sus calificaciones.

---

### Clasificación tradicional de ficheros y métodos de acceso

Antes del advenimiento de los Sistemas Gestores de Bases de Datos, la información digital se gestionaba mediante ficheros individuales. Según la literatura técnica de referencia, estos ficheros se clasifican bajo tres criterios principales:

#### A. Según su contenido

- **Ficheros de texto plano (ASCII / Unicode):** Almacenan secuencias de caracteres legibles directamente por el ser humano mediante editores sencillos. Ejemplos: `.txt`, `.csv`, `.xml`, `.html`.
    
- **Ficheros binarios:** Contienen datos codificados para ser procesados exclusivamente por aplicaciones específicas. Su contenido directo resulta ilegible en un editor de texto plano. Ejemplos: ejecutables (`.exe`), imágenes (`.png`, `.jpg`), documentos formateados (`.pdf`, `.docx`) o vídeos (`.avi`).
    

#### B. Según su organización y método de acceso

- **Acceso Secuencial:** Los datos se escriben de forma contigua en el soporte. Para consultar un registro en concreto, el sistema debe recorrer obligatoriamente todos los anteriores.
    
- **Acceso Directo (o Aleatorio):** Cada registro ocupa una longitud fija de caracteres en el fichero. Esto permite calcular matemáticamente la posición exacta del dato buscado y saltar directamente a él sin leer los previos. Su inconveniente es el desaprovechamiento de espacio en disco.
    
- **Acceso Indexado:** Utiliza una estructura de datos auxiliar (fichero de índice) que almacena parejas compuestas por el campo clave y la dirección del registro en el fichero principal. Permite búsquedas veloces por múltiples criterios sin necesidad de duplicar el fichero original ni perder espacio.
    

#### C. Según el soporte de almacenamiento

- **Soportes secuenciales:** Cintas magnéticas donde solo es posible implementar un acceso de tipo secuencial.
    
- **Soportes direccionables:** Discos duros (HDD) o unidades de estado sólido (SSD) que permiten accesos directos, aleatorios e indexados.
    

---

## 1.3 Problemas de los sistemas de archivos

Aunque estos sistemas informatizados fueron un gran avance respecto al papel, pronto se detectaron limitaciones importantes:

1. **Redundancia de datos**  
    La misma información se repetía en varios ficheros.  
    👉 Ejemplo: el nombre del alumno aparecía tanto en `alumnos.txt` como en `notas.txt`.
    
2. **Inconsistencia**  
    Si un dato se modificaba en un fichero pero no en otro, la información dejaba de coincidir.  
    👉 Ejemplo: si un alumno cambiaba de dirección y solo se actualizaba en `alumnos.txt`, los datos quedaban desfasados.
    
3. **Dependencia entre datos y programas**  
    Los programas dependían directamente del formato de los ficheros.  
    👉 Un simple cambio en la estructura del fichero obligaba a reprogramar las aplicaciones.
    
4. **Dificultad de acceso a la información**  
    Consultas más complejas requerían programar código adicional.  
    👉 Ejemplo: “alumnos mayores de 20 años con media superior a 7” obligaba a recorrer varios ficheros y calcularlo manualmente.
    
5. **Falta de seguridad**  
    Los ficheros no ofrecían un control detallado de accesos: cualquier persona con acceso al archivo podía leerlo o modificarlo.
    
6. **Escasa concurrencia**  
    Si varios usuarios accedían o modificaban los ficheros al mismo tiempo, era frecuente que se produjeran errores o incluso corrupción de datos.

---
