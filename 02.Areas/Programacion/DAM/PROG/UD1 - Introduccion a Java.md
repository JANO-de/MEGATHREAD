## Reglas de nomenclatura en los ejercicios

- Crear un proyecto por cada tema con el mismo nombre que el tema.
    
- Crear un paquete por cada boletín de ejercicios con el mismo nombre que el boletín de ejercicios.
    
- Crear una clase por cada ejercicio con el mismo nombre del ejercicio. Si el ejercicio contiene más de una clase, crear un paquete para el ejercicio.
    
- Si hay más de un número, separarlos con un guion bajo _.
    
- No poner tildes.
    

Ejemplo: veamos la nomenclatura del primer boletín de ejercicios llamado `Ejercicios 1.1 Tipos de datos primitivos` perteneciente al tema `1. Introducción`:

Proyecto: Tema1Introduccion

Paquete: ejercicios1_1TiposDeDatosPrimitivos

Clases: Ejercicio1, Ejercicio2, Ejercicio3, Ejercicio4, Ejercicio5, Ejercicio6

---

## 1 - Bytecode, JVM, JRE, JDK

**Bytecode**: Definicion de los .class que convierten el codigo Java a codigo ejecutable.

**JVM**: Java Virtual Machine, Maquina virtual de Java necesaria para ejecutar el codigo en multiples plataformas.

**JRE**: Java Runtime Enviroment, el entorno que contiene la maquina virtual de java y el resto de herramientas usadas, con la ventaja de que se fabrica para todas las plataformas pero necesita la misma version para ser ejecutado siempre, no se puede usar el jre 10 y ejecutar con el jre 21.

**JDK**: Java Development Kit, requerido para programar en java, contiene el JRE y el compilador para poder ejecutar el codigo programado en JAVA. 

---
## EJ 0

Crear un proyecto con 2 clases, una escrita en el paquete default y otra en un paquete propio. En ambos que sean ejecutables y con system outs que queramos.