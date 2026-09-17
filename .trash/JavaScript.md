
```html
<!DOCTYPE HTML>
<html>

<body>

  <p>Antes del script...</p>

  <script type="text/javascript"> ## No es necesario actualmente
    alert( '¡Hola, mundo!' );
  </script>

  <p>...Después del script.</p>

</body>

</html>
```

> Se utiliza archivos .js para codigos de JavaScript largos.

```html
<script src="/path/to/script.js"></script>
```

> [!NOTE]
> > Como regla general, solo los scripts más simples se colocan en el HTML. Los más complejos residen en archivos separados.
> > 
> > La ventaja de un archivo separado es que el navegador lo descargará y lo almacenará en [caché](https://es.wikipedia.org/wiki/Cach%C3%A9_\(inform%C3%A1tica\)).
> > 
> > Otras páginas que hacen referencia al mismo script lo tomarán del caché en lugar de descargarlo, por lo que el archivo solo se descarga una vez.
> > 
> > Eso reduce el tráfico y hace que las páginas sean más rápidas.

