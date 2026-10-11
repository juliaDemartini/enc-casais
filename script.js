
const photoInput = document.getElementById("couplePhoto");
const namesInput = document.getElementById("coupleNames");
const messageInput = document.getElementById("shortMessage");

const photoPreview = document.getElementById("photoPreview");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const previewNames = document.getElementById("previewNames");
const previewMessage = document.getElementById("previewMessage");
const nameCount = document.getElementById("nameCount");

const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const statusMessage = document.getElementById("statusMessage");
const shareCard = document.getElementById("shareCard");

let currentPhotoUrl = null;

// Exibe mensagens para a pessoa que está usando o site.
function setStatus(message) {
  statusMessage.textContent = message;
}

// Atualiza os nomes e a mensagem na prévia.
function updatePreview() {
  const names = namesInput.value.trim();
  const message = messageInput.value.trim();

  previewNames.textContent = names || "Seu nome aqui";
  nameCount.textContent = namesInput.value.length;

  previewMessage.textContent = message;
  previewMessage.hidden = !message;
}

// Permite selecionar a foto do casal.
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Por favor, escolha um arquivo de imagem.");
    photoInput.value = "";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    setStatus("A foto deve ter menos de 15 MB.");
    photoInput.value = "";
    return;
  }

  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
  }

  currentPhotoUrl = URL.createObjectURL(file);

  photoPreview.onload = () => {
    photoPreview.hidden = false;
    photoPlaceholder.hidden = true;
    setStatus("Foto adicionada com sucesso!");
  };

  photoPreview.onerror = () => {
    photoPreview.hidden = true;
    photoPlaceholder.hidden = false;
    setStatus("Não foi possível abrir a foto. Tente outra.");
  };

  photoPreview.src = currentPhotoUrl;
});

// Atualiza a prévia enquanto a pessoa digita.
namesInput.addEventListener("input", updatePreview);
messageInput.addEventListener("input", updatePreview);

// Aguarda a biblioteca de geração de imagens carregar.
function waitForHtml2Canvas() {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function checkLibrary() {
      if (typeof window.html2canvas === "function") {
        resolve();
        return;
      }

      attempts++;

      if (attempts >= 30) {
        reject(
          new Error(
            "A ferramenta de imagem não carregou. Verifique sua internet e atualize a página."
          )
        );
        return;
      }

      setTimeout(checkLibrary, 300);
    }

    checkLibrary();
  });
}

// Transforma o card em uma imagem PNG.
async function generateCardImage() {
  await waitForHtml2Canvas();

  if (!photoPreview.hidden && !photoPreview.complete) {
    await new Promise((resolve, reject) => {
      photoPreview.onload = resolve;
      photoPreview.onerror = reject;
    });
  }

  const canvas = await window.html2canvas(shareCard, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#fff8ed",
    logging: false
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Não foi possível criar a imagem."));
      }
    }, "image/png");
  });
}

// Faz o download do card.
async function downloadCard() {
  downloadBtn.disabled = true;
  setStatus("Gerando seu card. Aguarde...");

  try {
    const blob = await generateCardImage();
    const imageUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "eu-vou-encontro-de-casais.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(imageUrl), 2000);

    setStatus("Card baixado! Agora publique nos seus Status.");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Erro ao gerar o card. Tente novamente.");
  } finally {
    downloadBtn.disabled = false;
  }
}

// Compartilha o card usando as opções disponíveis no dispositivo.
async function shareCardImage() {
  shareBtn.disabled = true;
  setStatus("Preparando seu card para compartilhar...");

  try {
    const blob = await generateCardImage();

    const file = new File(
      [blob],
      "eu-vou-encontro-de-casais.png",
      { type: "image/png" }
    );

    const message =
      "Eu vou! ❤️ Encontro de Casais\n" +
      "14 de novembro de 2026, às 19h.\n" +
      "Colossenses 3:14";

    // Alguns celulares permitem compartilhar a imagem diretamente.
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "Eu Vou! — Encontro de Casais",
        text: message
      });

      setStatus("Compartilhamento concluído ou enviado para o aplicativo escolhido.");
    } else {
      // Alternativa para navegadores sem compartilhamento de arquivos.
      const imageUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = imageUrl;
      link.download = "eu-vou-encontro-de-casais.png";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(imageUrl), 2000);

      const whatsappUrl =
        "https://wa.me/?text=" + encodeURIComponent(message);

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      setStatus(
        "Imagem baixada! No WhatsApp, anexe o PNG à conversa antes de enviar."
      );
    }
  } catch (error) {
    if (error.name === "AbortError") {
      setStatus("Compartilhamento cancelado.");
    } else {
      console.error(error);
      setStatus(error.message || "Não foi possível compartilhar o card.");
    }
  } finally {
    shareBtn.disabled = false;
  }
}

// Liga as funções aos botões.
downloadBtn.addEventListener("click", downloadCard);
shareBtn.addEventListener("click", shareCardImage);

// Inicializa a prévia.
updatePreview();
