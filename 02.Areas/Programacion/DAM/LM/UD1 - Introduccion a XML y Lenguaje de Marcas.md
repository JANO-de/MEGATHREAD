#### Lenguaje de marcas
Diseñado para el texo narrativo, utiliza marcas que ayudan a dar formato al texto.

#### Clasificacion de lenguajes de marcas
- Marcado de puntuacion -> Puntos, comas, etc.
- Marado de presentacion -> Marcado realizado sobre entidades de nivel superior (Parrafos/paginas) oara mejorar la claridad visual.
	Ejemplo:
```
	El Quijote comienza con este célebre fragmento:

    En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho
    que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín
    flaco y galgo corredor.

	El Buscón, en cambio, ...
```
- Marcado de Procedimiento -> Marcado que expresa ordenes que un procesador de texto debe ejecutar para dar formato al texto.
	Ejemplo:
```
.sk 2 a;.in +10 −10;.ls 0;.cp 2
En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho
vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco
galgo corredor.
.sk 2 a;.in −10 +10;.cp 2;.ls 1
El Buscón, en cambio,
```
- Marcado descriptivo -> Marcado que identifica cada elemento del texto, sin expresar su procesado.
	Ejemplo MD
	```html
<p>El Quijote comienza con este célebre fragmento:
<blockquote>
  En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho
  que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín
  flaco y galgo corredor.
</blockquote>
<p>El Buscón, en cambio, ...</p>
	```
- Marcado referencial -> Marcas que refieren a etidades externas y que durante el procesamiento deben ser reemplazadas por estas. 
- Metamarcado -> Marcado que permite la interpretacion del propio marcado o ampliar el vocabulario de marcas.
