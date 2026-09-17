#bbdd #DAM #1año #ra1
Codigo classroom: 
### 7fngrrcl
## Cuestionario

1. Si dos usuarios abren al mismo tiempo un archvo de excel llamado inventario.xlsx guardado en un pendrive compartido y ambos modifican la cantidad del mismo producto a la vez que crees que ocurrira con los datos cuando ambos guarden el archivo?
	- No permitiria guardar el cambio al archivo o se corromperia

1. **Un archivo ejecutable de un juego (juego.exe), una imagen (foto.png) y una lista de contactos (contactos.txt): ¿En que se diferencian segun la forma en que el ordenador almacena y lee su contenido interno?**
	- Se diferencia en el tipo de archivo, la imagen almacena el contenido de una forma mientras que el ejecutable almacena codigo que lanza y otros archivos, y la lista de contacto tiene un formato de texto plano que se acepta por la aplicacion de telefono que otras aplicaciones no reconocerian.

3. Imagina que estas realizando una transferencia bancaria de 100€ desde tu movil. El banco resta 100€ de tu cuenta, pero justo en ese millisegundo se e cae la cobertura del telefono antes de sumar los 100€ en la cuenta del destinatario. ¿Que deberia hacer el sistema del banco para evitar que el dinero desaparezca?
	- El programa del banco haria un rollback del dinero a la cuenta del telefono de la persona que lo manda para evitar fallos devolviendo los 100€ y marcando la transaccion como fallida, solo permitiendo que se realice una vez tenga cobertura.

4. ¿Que diferencia tecnica crees que existe entre tener una pelicula guardada en el disco duro de tu ordenador local o ver esa misma pelicula en streaming a traves de Netflix o Prime Video?
	- Que la pelicula en tu ordenador esta almacenada de manera local como un fichero, mientras que la pelicula en streaming esta en un servidor y solo se puede acceder por red a traves de las aplicaciones web de Netflix o Prime. Almacenamiento web/Almacenamiento en Red.

---
# Sistemas de almacenamiento de la informacion

#### Clasificacion tradicional de ficheros y metodos de acceso

> [!NOTE] Ejercicio 1
> Reto 1: Búsqueda y Cálculo del Gasto Total (Redundancia y Desorganización)
> Revisa el archivo fila a fila y calcula el gasto total acumulado del cliente 101 (Juan Pérez).
> 
> Anota todas las filas donde aparece este cliente y señala qué dificultades has encontrado para estar seguro/a de no haber olvidado ningún pedido.
> 
> Reto 2: Logística y Error de Envío (Inconsistencia de Datos)
> El departamento de almacén debe enviar hoy el pedido 5019 perteneciente a la cliente 102 (Ana Gómez). ¿A qué dirección física debes rotular el paquete según la fila 19?
> 
> Revisa el historial de pedidos anteriores de Ana Gómez (filas 2, 5, 11 y 19). ¿Existe algún problema grave con su dirección de envío? Si el paquete se manda a la dirección de la fila 19, ¿llegará a su destino real?
> 
> Reto 3: Mantenimiento y Coste de Modificación
> El cliente 101 solicita actualizar su teléfono de contacto y fijar su correo electrónico oficial en juan.perez.nuevo@gmail.com.
> 
> ¿En cuántas filas de este archivo tendrías que modificar la información manualmente? ¿Qué ocurriría si el operador se olvida de actualizar la fila 20?
> 
> Reto 4: Integridad Referencial y Anomalías de Inserción
> Analiza el pedido 5010 (fila 10). ¿Qué datos figuran en el cliente?
> 
> ¿Ha impedido el archivo informático que se registre un pedido asignado a un cliente ficticio o 999? ¿Cómo evitaría esto un Sistema Gestor de Bases de Datos?
> 
> Reto 5: Formatos Heterogéneos y Desarrollo de Software
> Si tuvieras que programar una aplicación que ordene los pedidos cronológicamente por la columna Fecha_Pedido, ¿qué problema encuentras en las fechas almacenadas?
> 
> Enumera al menos 3 formatos de fecha diferentes que conviven en este único archivo.

##### EJ 1
Gasto total (con tilde): 765
Gasto total (sin tilde): 70
Gasto total (dos apellidos): 160
Gasto total (todos): 995 

Filas: 1, 3(sin tilde), 7, 14, 20(sin tilde)
Dificultades: Tener que ver en un archivo de texto, nombres cambiados en acentuacion y con mismo codigo 101 ademas de un juan perez con dos apellidos y mismo codigo.

##### EJ 2

Segun la fila 19, el paquete deberia rotular a la direccion AV. España 45, Sevilla.

Tiene el problema grave de que en los pedidos de las filas 2 y 19 estan a la direccion AV España 45, Sevilla y las filas 5 y 11 a la direccion Calle Nueva 8 Sevilla. Si el paquete se envia a la calle del pediddo 19 no llegara al destinatario pues se mudo a la calle nueva 8.

##### EJ 3
Tendran que modificar 4 filas de archivo. Si no se actualiza manualmente los datos de la fila 20 el correo no le lleara al destinatario.

##### EJ 4
Figuran estos datos que son incongruentes por que no dan ninguna informacion:
999,Desconocido,anonimo@mail.com,000000000,Desconocida,5010,2026-09-10,Silla Gaming,1,180.00,180.00,Pagado

No lo ha impedido y esto se haria en el sistema de gestor de base de datos asegurando que las conexiones entre tablas sean siempre validas y correctas.

##### EJ 5
El problema principal es que el formato de fecha es distinto para cada pedido, compartiendose el formato entre pocos, haciendo que un programa para ordenar los datos por fecha_pedido requiera que se cambie manualmente el formato al mismo en todos los pedidos.

Fila 20:2026-09-20
Fila 19: 19-09-2026
Fila 17: 17/09/2026