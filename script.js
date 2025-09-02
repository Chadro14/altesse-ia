const messages = document.getElementById("messages");
const input = document.getElementById("input");
const restoreFile = document.getElementById("restoreFile");
const voiceButton = document.getElementById("voiceButton");

let isListening = false;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'fr-FR';

recognition.continuous = true;
recognition.interimResults = false;

// Message initial du bot avec le texte personnalisé
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

function speakMessage(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
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
    speakMessage(botReply);
  } catch {
    addMessage("Erreur API", "bot");
    speakMessage("Erreur de connexion à l'API de Kyotaka.");
  }
}

async function restorePhoto(file) {
  addMessage("Envoi de la photo...", "user");
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Image = reader.result.split(',')[1];
    try {
      const res = await fetch("https://api.market/store/magicapi/ai-photo-restoration-colorization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "VOTRE_CLÉ_D'API"
        },
        body: JSON.stringify({ image_base64: base64Image, mode: "colorization" })
      });
      const data = await res.json();
      if (data.status === "success" && data.image_base64) {
        const restoredImageUrl = "data:image/png;base64," + data.image_base64;
        addMessage("Votre photo restaurée :", "bot");
        addMessage(restoredImageUrl, "bot", true);
        speakMessage("Votre photo a été restaurée.");
      } else {
        addMessage("Erreur lors de la restauration : " + (data.message || JSON.stringify(data)), "bot");
        speakMessage("Une erreur est survenue lors de la restauration de la photo.");
      }
    } catch (error) {
      addMessage("Erreur API lors de la restauration", "bot");
      speakMessage("Impossible de se connecter à l'API de restauration de photos.");
    }
  };
  reader.readAsDataURL(file);
}

async function generateImage() {
    const prompt = input.value.trim();
    if (!prompt) {
        addMessage("Veuillez entrer une description d'image.", "bot");
        speakMessage("Veuillez entrer une description d'image.");
        return;
    }
    addMessage(`Génération d'image pour : "${prompt}"`, "user");
    input.value = "";
    try {
        const res = await fetch("https://api.kie.ai/v1/image-generation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "VOTRE_CLÉ_D'API"
            },
            body: JSON.stringify({ prompt: prompt, model: "midjourney" })
        });
        const data = await res.json();
        if (data.status === "success" && data.output_url) {
            addMessage("Votre image générée :", "bot");
            addMessage(data.output_url, "bot", true, 'image');
            speakMessage("Votre image a été générée.");
        } else {
            addMessage("Erreur lors de la génération d'image : " + (data.message || JSON.stringify(data)), "bot");
            speakMessage("Une erreur est survenue lors de la génération d'image.");
        }
    } catch (error) {
        addMessage("Erreur API lors de la génération d'image.", "bot");
        speakMessage("Impossible de se connecter à l'API de génération d'image.");
    }
}

async function generateVideo() {
    const prompt = input.value.trim();
    if (!prompt) {
        addMessage("Veuillez entrer une description de vidéo.", "bot");
        speakMessage("Veuillez entrer une description de vidéo.");
        return;
    }
    addMessage(`Génération de vidéo pour : "${prompt}"`, "user");
    input.value = "";
    try {
        const res = await fetch("https://api.kie.ai/v1/video-generation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "VOTRE_CLÉ_D'API"
            },
            body: JSON.stringify({ prompt: prompt, model: "veo3" })
        });
        const data = await res.json();
        if (data.status === "success" && data.output_url) {
            addMessage("Votre vidéo générée :", "bot");
            addMessage(data.output_url, "bot", true, 'video');
            speakMessage("Votre vidéo a été générée.");
        } else {
            addMessage("Erreur lors de la génération de vidéo : " + (data.message || JSON.stringify(data)), "bot");
            speakMessage("Une erreur est survenue lors de la génération de vidéo.");
        }
    } catch (error) {
        addMessage("Erreur API lors de la génération de vidéo.", "bot");
        speakMessage("Impossible de se connecter à l'API de génération de vidéo.");
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
    if (!isListening) {
        recognition.start();
        isListening = true;
        voiceButton.textContent = "🔴 Stop";
        addMessage("Je vous écoute...", "bot");
    } else {
        recognition.stop();
        isListening = false;
        voiceButton.textContent = "🎙️ Parler";
        addMessage("Reconnaissance vocale arrêtée.", "bot");
    }
});

recognition.onresult = (event) => {
    const speech = event.results[event.results.length - 1][0].transcript;
    input.value = speech;
    recognition.stop();
    isListening = false;
    voiceButton.textContent = "🎙️ Parler";
    sendMessage();
};

recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    addMessage(`Erreur de reconnaissance vocale : ${event.error}`, "bot");
    isListening = false;
    voiceButton.textContent = "🎙️ Parler";
};

recognition.onend = () => {
    if (isListening) {
        recognition.start();
    }
};
    
