# Tarjeta del Día del Padre

Experiencia web escrita desde Melody para su papá.

## Archivos

- `index.html`: tarjeta editable.
- `assets/css/padre.css`: diseño y adaptación para celular.
- `assets/js/padre.js`: escenas, sonidos e interacciones.
- `assets/audio/melody-para-papa.m4a`: música de fondo.
- `assets/images/`: recursos visuales del proyecto.
- `dist/dia_del_padre_para_papa.html`: archivo único para compartir.
- `tools/build-standalone.ps1`: vuelve a generar el archivo de `dist`.

## Generar el HTML para WhatsApp

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-standalone.ps1
```

La portada usa un universo animado creado con canvas y CSS: estrellas,
cometas y mariposas luminosas sin dependencias externas.
