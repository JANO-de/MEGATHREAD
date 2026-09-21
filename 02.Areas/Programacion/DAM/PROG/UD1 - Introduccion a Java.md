---
cssclasses:
  - page-white
---
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

---
---
# Clase 1 2026-09-21
## Variables
Son contenedores que sirven para almacenar los datos que utiliza un programa dentro de la memoria RAM.
- Se escriben en minuscula.
- Si son varias palabras se hace lowerCamelCase. (myVariableInJava)
- Pueden contener caracteres de "_" o "$" pero nunca empezar por ellos.
- Pueden contener numeros pero nunca como primer caracter.
- Deben ser cortos pero significativos.
#### Declaracion de Variables
```Java
int days;
float cash;
boolean typeMoney;
```
Java es fuertemente tipado. Por convencion de codigo las variables se ponen al principio.
#### Inicializacion de Variables
```Java
int x=12;
float y:
·
·
·
y=12.3;
```
Se usa el operador de asignacion "=" para darle un valor a las variables.
```Java
int days, weeks, years;
```
Se pueden declarar varias variables a la vez del mismo tipo.

### Tipos de Dato Primitivo
| ==Tipo de Variable== | ==Bytes que ocupa== | ==Rango de valores==           |
| -------------------- | ------------------- | ------------------------------ |
| boolean              | 1                   | true, false                    |
| char                 | 2                   | Caracteres Unicode             |
| byte                 | 1                   | -128 a 127                     |
| short                | 2                   | -32.768 a 32.767               |
| int                  | 4                   | -2.147.483.648 a 2.147.483.647 |
| long                 | 8                   | -9·10^38 a 9·10^38             |
| float                | 4                   | -3.4·10^38 a 3.4·10^38         |
| double               | 8                   | -1.79·10^308 a 1.79·10^308     |
#### Casting
Operacion para convertir valores de un tipo a otro.
```Java
int i=12;
byte b=(byte) i;
```

#### Secuencia de escape
Conjunto de caracteres que en el codigo se interpreta con algun fin. Por ejemplo `\` es un caracter de escape que hace que el caracter puesto a continuacion se convierta en un caracter especial.

| ==Caracter== | ==Significado==                                                                 |
| ------------ | ------------------------------------------------------------------------------- |
| \t           | Tabulador                                                                       |
| \n           | Salto de linea                                                                  |
| \\\          | Barra invertida                                                                 |
| \udddd       | DRepresenta el caracter unicode cuyo codigo es representado por el dddd en hex. |
