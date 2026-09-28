---
tags:
  - 1año
  - DAM
  - ProgramacionJava
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

---
---
# 1.1 Char, String y Operadores
## Caracteres
Variables tipo char pueden ser llamados en codigo unicode ( Hex, Decimal), en texto plano "C". Estan tambien los caracteres especiales, caracteres que al ser colocados tras un `\` reciben una funcion, por ejemplo `\n` imprime una nueva linea, `\'` Imprime comillas simples, `\"` Imprime comillas dobles, `"` Doble comillas se pueden usar como caracter, `\\` Imprime una barra invertida, `System.out.println("character"); ... character = 9752` Imprime el simbolo de un trevol.

---
## Strings
Son cadenas de caracteres usados para imprimir palabras, frases, etc.. 
```java
String s1 = "Línea 1\nLínea 2\nLínea 3";

String s2 = """

            Línea 1

            Línea 2

            Línea 3

            """;
// Ejemplo de cadena vacia:
String s3 = "";
```

---
## Operadores

Los operadores llevan a cabo operaciones sobre datos u operandos primitivos devolviendo un valor default primitivo. Si es solo uno es un **Operador Unario**, dos **Operador Binario** y tres **Operador Ternario**.
### Prioridad de Operadores
| Nivel | Operador                                                             |                                                           Descripcion                                                           |                      Asociatividad                      |
| ----- | -------------------------------------------------------------------- | :-----------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------: |
| 1     | []<br>.<br>()                                                        |                                 Acceso elementos array<br>Acceso miembros objetos<br>Parentesis                                 |                 De derecha a izquierda                  |
| 2     | ++<br>--                                                             |                                        Unario post-incremento<br>Unario post-decremento                                         |                 De derecha a izquierda                  |
| 3     | ++<br>--<br>+<br>-<br>!<br>~                                         | Unario pre-incremento<br>Unario pre-decremento<br>Unario mas<br>Unario menos<br>Unario logico NOT<br>Unario NOT a nivel de bits |             <br><br>De izquierda a derecha              |
| 4     | ()<br>new                                                            |                                                   Cast<br>Creacion de objetos                                                   |                 De izquierda a derecha                  |
| 5     | *<br>/<br>%                                                          |                                              Multiplicacion<br>Division<br>Modulo                                               |               <br>De izquierda a derecha                |
| 6     | +<br>-<br>+                                                          |                                             Suma<br>Resta<br>Concatenacion cadenas                                              |                   <br>No asociativos                    |
| 7     | <<<br>>><br>>>>                                                      |                                               <br>Desplazamientos a nivel de bits                                               |                 De izquierda a derecha                  |
| 8     | <<br>< =<br>><br>> =<br>instanceof                                   |                                                      <br><br>Relacionales                                                       |             <br><br>De izquierda a derecha              |
| 9     | ==<br>! =                                                            |                                                        Igual<br>Distinto                                                        |                 De izquierda a derecha                  |
| 10    | &                                                                    |                                                        AND a nivel bits                                                         |                 De izquierda a derecha                  |
| 11    | ^                                                                    |                                                        XOR a nivel bits                                                         |                 De izquierda a derecha                  |
| 12    | \|                                                                   |                                                         OR a nivel bits                                                         |                 De izquierda a derecha                  |
| 13    | &&                                                                   |                                                               AND                                                               |                 De izquierda a derecha                  |
| 14    | \|\|                                                                 |                                                               OR                                                                |                 De izquierda a derecha                  |
| 15    | ?:                                                                   |                                                      Ternario condicional                                                       |                 De derecha a izquierda                  |
| 16    | =<br>+=<br>-=<br>**=*<br>/=<br>%=<br>^=<br>\|=<br><<=<br>>>=<br>>>>= |                                                <br><br><br><br><br>Asignaciones                                                 | <br><br><br><br><center>De derecha a izquierda</center> |
El resultado de las operaciones depende de los tipos de operandos involucrados, por ejemplo el tipo del resultado se onvierte al mas general segun el orden:

`Byte -> Short -> Int -> Long -> Float -> Double`

Si se divide entre 0 con numeros enteros se genera la excepcion `ArithmeticException`, minetras que si se realiza con deccimales, el resultado da infinito `Infinity`.

Y si se intenta operar infinitos con infinitos el resultado da un `NaN` Not a Number.

**Ejemplos**
```java
int i1 = 10;
int i2 = 0;
double i3 = 2.3;

int inf1 = i3/i2
int inf2 = inf1

System.out.println(i1/i2); //ArithmeticError
System.out.println(inf1); //Infinity
System.out.println(inf1+inf2); //NaN
```

---
## Cortocircuitos


```Java
System.out.println(int1/int2); //airthmeticexception
// Se arregla con un cortafuegos
b!=0 // false
```

---
## Ejercicios 1.1 Expresiones

> [!NOTE] Ejercicio 1
> Calcula el resultado de las siguientes expresiones:
> 1. 3 * 5 – 4 / 2
> 2. 7 – 4 * 2 – 5 * 2
> 3. 5 + 4 < 7 + 8
> 4. 4 < 5 * 4 / 2 – 7
> 5. ! (4 > 6)

> [!NOTE] Ejercicio 2
> Dados los siguientes valores para las variables booleanas a, b y c ( a = true, b = false y c = true), evaluar las expresiones que aparecen a continuación:
> 6. a && b || a && c
> 7. (a || ! b) && (! a || c)
> 8. a || b && c
> 9. ! (a || b) && c

> [!NOTE] Ejercicio 3
> Las siguientes asignaciones dan error. Soluciónalas con un casting o con una letra (en el caso de los literales):
> 10. int x = 165698L;
> 11. short s=56; byte b=s;
> 12. byte b = 129;
> 13. float f = 5.89;
> 14. long l = 8.42;
> 15. char c1='a',c2; c2 = c1 + 7;
> 16. byte b; short s=7; boolean a=true; b = a ? s++:--s;

> [!NOTE] Ejercicio 4
> De las siguientes asignaciones ¿cuáles son válidas? ¿Cuál es el defecto de su ejecución? ¿De qué tipo deben ser las variables?:
>
> 1. z = 2 < 1
> 2. a = a + 1
> 3. ‘x’ = ‘y’
> 4. x = ‘y’
> 5. a = b
> 6. precio = precio – precio*(30/100)
> 7. a = a<b?5+1:7-3*2
> 8. a = b / 0
> 9. i=++j
> 10. i=j++
> 11. c='''
> 12. c='”'
> 13. c='c'
> 14. s=”'”
> 15. s=”””
> 16. c='\u0041'
> 17. c=65
> 18. x = (a>b?5.4*3:65.1/8)
> 19. a == a>b?3+6:9-4
> 20. d = !a?c++:--c

---
---
# 1.2 Funciones

## Introduccion
Un subprograma es un subalgoritmo que forma parte del algoritmo principal que permite resolver tareas especificas.

- Funcion: Conjunto de instrucciones que devuelven un resultado.
- Procedimiento: Conjunto de instrucciones que se ejecutan sin devolver resultado.
- Metodo: Funcion o Procedimiento que pertenece a un objeto.

## Construccion
Una funcion se construye de la siguiente forma:
```Java
modificador_acceso tipo_resultado nombre_funcion (tipo_parametro nombre_parametro, ...) {
	instrucciones
	return expresion;
}
```

- **modificador_acceso**: Visibilidad del archivo.
- **tipo_resultado**: Tipo del resultado de la funcion.
- **nombre_funcion**: El nombre de la funcion en lowerCamelCase.
- **tipo_parametro nombre_parametro**: Valores requeridos por la funcion que son heredaras.

---

---
---
# 1.3 Programacion Orientada a Objetos (POO) 


---
---
# 1.4 Cadenas