# MusicHub · integrada

Frontend integrado en Nexus. Todas sus llamadas se envían al mismo origen mediante `/api/music-hub/*`; el Worker del portal las reenvía por service binding al Worker Cloudflare `musichub`, que conserva su base D1 existente.

Los datos reales —usuarios, canciones, reproducciones, favoritos, géneros y playlists— permanecen en la base de datos de MusicHub. Los archivos de audio no se copian: la aplicación reproduce los enlaces admitidos desde YouTube, Spotify o SoundCloud.
