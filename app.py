from flask import Flask, render_template, request, jsonify
import yt_dlp
import os
import threading

app = Flask(__name__)

# Ruta de la carpeta de descargas del sistema
DOWNLOAD_FOLDER = os.path.expanduser('~/Downloads')

# Lista para almacenar los videos a descargar
videos = []

# Función para obtener información de un video
def get_video_info(url):
    ydl_opts = {"quiet": True, "extract_flat": True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return {
        "title": info.get("title", "Sin título"),
        "artist": info.get("uploader", "Desconocido"),
        "duration": info.get("duration", 0)
    }

# Función para descargar un video
def download_video(url, title, artist):
    ydl_opts = {
        "outtmpl": os.path.join(DOWNLOAD_FOLDER, title),  # Quitar la extensión .mp3 aquí
        "format": "bestaudio/best",  # Descargar solo audio
        "postprocessors": [{
            "key": "FFmpegExtractAudio",  # Extraer solo el audio
            "preferredcodec": "mp3",  # Convertir a MP3
            "preferredquality": "192",  # Calidad del audio
        }],
        "merge_output_format": "mp3",
        "postprocessor_args": [
            "-metadata", f"title={title}",
            "-metadata", f"artist={artist}"
        ]
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"Error al descargar el video {title}: {e}")






@app.route("/")
def index():
    return render_template("index.html")

@app.route("/add_video", methods=["POST"])
def add_video():
    try:
        url = request.json.get("url")
        info = get_video_info(url)
        info["url"] = url
        videos.append(info)
        return jsonify(info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/delete_video", methods=["POST"])
def delete_video():
    index = request.json.get("index")
    if 0 <= index < len(videos):
        del videos[index]
        return jsonify({"success": True}), 200
    return jsonify({"error": "Índice no válido"}), 400

@app.route("/download_all", methods=["POST"])
def download_all():
    videos_data = request.json  # Ahora obtienes la lista de videos con todos los datos

    threads = []
    for video in videos_data:
        # Asegúrate de que aquí se usan los tres parámetros: url, title y artist
        t = threading.Thread(target=download_video, args=(video["url"], video["title"], video["artist"]))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    return jsonify({"success": True}), 200



if __name__ == "__main__":
    app.run(debug=True)
