const messages = document.getElementById("messages");
const input = document.getElementById("input");
const restoreFile = document.getElementById("restoreFile");
const voiceButton = document.getElementById("voiceButton");

let isListening = false;
let recognition;
let timer;
let startTime;

if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        voiceButton.textContent = "🔴 Stop";
        startTime = Date.now();
        timer = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            voiceButton.textContent = `🔴 Stop (${elapsedTime}s)`;
        }, 1000);
    };

    recognition.onresult = (event) => {
        let interim_transcript = '';
        let final_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        input.value = final_transcript + interim_transcript;
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        addMessage(`Erreur de reconnaissance vocale : ${event.error}`, "bot");
        isListening = false;
        voiceButton.textContent = "🎙️ Parler";
        clearInterval(timer);
    };

    recognition.onend = () => {
        isListening = false;
        voiceButton.textContent = "🎙️ Parler";
        clearInterval(timer);
        if (input.value.trim() !== '') {
            sendMessage();
        }
    };

} else {
    voiceButton.disabled = true;
    voiceButton.textContent = "API non supportée";
    addMessage("Votre navigateur ne supporte pas la reconnaissance vocale.", "bot");
}

const botNote = `
  Salut, je suis **Altesse AI**.
  Amélioré le 2 septembre 2025 par *son Altesse*.
`;
addMessage(botNote, "bot");

function addMessage(content, type, isMedia = false, mediaType = 'image') {
  const msg = document.createElement("div");
  msg.classList.add("msg", type);
  if (isMedia) {
    const mediaContainer = document.createElement("div");
    mediaContainer.classList.add("image-container");
    let mediaElement;
    if (mediaType === 'image') {
      mediaElement = document.createElement("img");
    } else {
      mediaElement = document.createElement("video");
      mediaElement.controls = true;
    }
    mediaElement.src = content;
    mediaContainer.appendChild(mediaElement);
    msg.appendChild(mediaContainer);
  } else {
    msg.innerHTML = content.replace(/\n/g, '<br>');
  }
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";
  try {
    const res = await fetch("https://kyotaka-api.vercel.app/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text })
    });
    const data = await res.json();
    const botReply = data.reply || data.message || JSON.stringify(data);
    addMessage(botReply, "bot");
  } catch {
    addMessage("Erreur API", "bot");
  }
}

async function restorePhoto(file) {
  addMessage("Envoi de la photo...", "user");
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Image = reader.result.split(',')[1];
    try {
      const res = await fetch("https://api.deepai.org/api/photo-restoration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "VOTRE_CLÉ_D'API_DEEP_AI"
        },
        body: JSON.stringify({ image_base64: base64Image })
      });
      const data = await res.json();
      if (data.status === "success" && data.output_url) {
        const restoredImageUrl = "data:image/png;base64," + data.image_base64;
        addMessage("Votre photo restaurée :", "bot");
        addMessage(restoredImageUrl, "bot", true);
      } else {
        addMessage("Erreur lors de la restauration : " + (data.message || JSON.stringify(data)), "bot");
      }
    } catch (error) {
      addMessage("Erreur API lors de la restauration", "bot");
    }
  };
  reader.readAsDataURL(file);
}

async function generateImage() {
    const prompt = input.value.trim();
    if (!prompt) {
        addMessage("Veuillez entrer une description d'image.", "bot");
        return;
    }
    addMessage(`Génération d'image pour : "${prompt}"`, "user");
    input.value = "";
    try {
        const res = await fetch("https://api.kie.ai/v1/image-generation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "VOTRE_CLÉ_D'API_KIE"
            },
            body: JSON.stringify({ prompt: prompt, model: "midjourney" })
        });
        const data = await res.json();
        if (data.status === "success" && data.output_url) {
            addMessage("Votre image générée :", "bot");
            addMessage(data.output_url, "bot", true, 'image');
        } else {
            addMessage("Erreur lors de la génération d'image : " + (data.message || JSON.stringify(data)), "bot");
        }
    } catch (error) {
        addMessage("Erreur API lors de la génération d'image.", "bot");
    }
}

async function generateVideo() {
    const prompt = input.value.trim();
    if (!prompt) {
        addMessage("Veuillez entrer une description de vidéo.", "bot");
        return;
    }
    addMessage(`Génération de vidéo pour : "${prompt}"`, "user");
    input.value = "";
    try {
        const res = await fetch("https://api.kie.ai/v1/video-generation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "VOTRE_CLÉ_D'API_KIE"
            },
            body: JSON.stringify({ prompt: prompt, model: "veo3" })
        });
        const data = await res.json();
        if (data.status === "success" && data.output_url) {
            addMessage("Votre vidéo générée :", "bot");
            addMessage(data.output_url, "bot", true, 'video');
        } else {
            addMessage("Erreur lors de la génération de vidéo : " + (data.message || JSON.stringify(data)), "bot");
        }
    } catch (error) {
        addMessage("Erreur API lors de la génération de vidéo.", "bot");
    }
}

async function searchWeb() {
    const query = input.value.trim();
    if (!query) {
        addMessage("Veuillez entrer une requête de recherche.", "bot");
        return;
    }
    addMessage(`Recherche sur le web pour : "${query}"`, "user");
    input.value = "";
    try {
        const res = await fetch("https://api.serpstack.com/search?access_key=VOTRE_CLÉ_D'API_DE_RECHERCHE&query=" + encodeURIComponent(query));
        const data = await res.json();
        if (data.search_results && data.search_results.length > 0) {
            let results = "Voici les résultats de ma recherche :<br>";
            data.search_results.slice(0, 3).forEach(result => {
                results += `<br>• <a href="${result.url}" target="_blank">${result.title}</a><br>${result.snippet}<br>`;
            });
            addMessage(results, "bot");
        } else {
            addMessage("Aucun résultat trouvé pour cette requête.", "bot");
        }
    } catch (error) {
        addMessage("Erreur lors de la recherche sur le web.", "bot");
    }
}

async function executeCode() {
    const code = input.value.trim();
    if (!code) {
        addMessage("Veuillez entrer le code à exécuter.", "bot");
        return;
    }
    addMessage("Exécution du code...", "user");
    input.value = "";
    try {
        const res = await fetch("https://api.paiza.io/runners/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code: code,
                language: "javascript",
                api_key: "VOTRE_CLÉ_D'API_CODAGE"
            })
        });
        const data = await res.json();
        if (data.stdout) {
            addMessage("Résultat du code :<br><pre>" + data.stdout + "</pre>", "bot");
        } else if (data.stderr) {
            addMessage("Erreur de codage :<br><pre>" + data.stderr + "</pre>", "bot");
        } else {
            addMessage("Impossible d'exécuter le code. " + (data.message || JSON.stringify(data)), "bot");
        }
    } catch (error) {
        addMessage("Erreur de connexion à l'API de codage.", "bot");
    }
}

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

restoreFile.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    restorePhoto(e.target.files[0]);
  }
});

voiceButton.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
});
  
