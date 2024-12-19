document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("url-input");
    const addBtn = document.getElementById("add-btn");
    const videoTable = document.getElementById("video-table").querySelector("tbody");
    const errorMsg = document.getElementById("error-msg");
    const downloadBtn = document.getElementById("download-btn");

    // Función para actualizar el título con la cantidad de canciones
    function updateTitle() {
        const count = videoTable.querySelectorAll("tr").length;
        document.title = `Descargador de Música (${count})`;
    }

    // Función para actualizar el índice de cada fila
    function updateIndices() {
        const rows = videoTable.querySelectorAll("tr");
        rows.forEach((row, index) => {
            row.querySelector(".index").textContent = index + 1;
        });
    }

    // Función para limpiar el enlace de YouTube
    function cleanYouTubeLink(url) {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:&list=[a-zA-Z0-9_-]+)?/;
        const match = url.match(youtubeRegex);

        if (match) {
            const videoId = match[1];
            return `https://www.youtube.com/watch?v=${videoId}`;
        }
        return url; // Si el enlace no es válido, devuelve el enlace original
    }

    // Agregar el enlace de video a la tabla
    addBtn.addEventListener("click", async () => {
        let url = urlInput.value.trim();

        // Limpiar el enlace de YouTube si tiene el parámetro 'list'
        url = cleanYouTubeLink(url);

        // Comprobar si el enlace es válido de YouTube
        if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url)) {
            errorMsg.textContent = "Enlace no válido";
            return;
        }
        errorMsg.textContent = "";
        urlInput.value = "";

        // Hacer la solicitud para agregar el video
        const response = await fetch("/add_video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (response.ok) {
            const video = await response.json();
            addVideoToTable(video);
        } else {
            errorMsg.textContent = "Error al procesar el enlace";
        }
    });

    // Función para agregar un video a la tabla
    function addVideoToTable(video) {
        const row = document.createElement("tr");
        row.dataset.url = video.url;

        row.innerHTML = `
            <td class="index"></td>
            <td contenteditable="true">${video.title}</td>
            <td contenteditable="true">${video.artist}</td>
            <td>${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}</td>
            <td><button class="delete-btn">✖</button></td>
        `;

        row.querySelector(".delete-btn").addEventListener("click", () => {
            row.remove();
            updateIndices();
            updateTitle();
        });

        // Insertar la fila al inicio de la tabla
        videoTable.insertBefore(row, videoTable.firstChild);

        updateIndices();
        updateTitle();
    }

    // Función para descargar todos los videos
    downloadBtn.addEventListener("click", async () => {
        const rows = videoTable.querySelectorAll("tr");
        const videos = [...rows].map(row => ({
            title: row.cells[1].textContent.trim(),
            artist: row.cells[2].textContent.trim(),
            url: row.dataset.url
        }));

        await fetch("/download_all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(videos)
        });
    });
});
