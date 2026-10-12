
(() => {
  "use strict";

  // ==========================================
  // ELEMENTOS DO SITE
  // ==========================================

  const photoInput = document.getElementById("couplePhoto");
  const namesInput = document.getElementById("coupleNames");
  const messageInput = document.getElementById("customMessage");

  const photoPreview = document.getElementById("photoPreview");
  const photoPlaceholder = document.getElementById("photoPlaceholder");

  const cardNames = document.getElementById("cardNames");
  const cardMessage = document.getElementById("cardMessage");
  const nameCount = document.getElementById("nameCount");

  const card = document.getElementById("shareCard");
  const downloadButton = document.getElementById("downloadButton");
  const whatsappButton = document.getElementById("whatsappButton");
  const statusMessage = document.getElementById("statusMessage");

  let currentPhotoUrl = null;

  // ==========================================
  // MENSAGENS DE STATUS
  // ==========================================

  function setStatus(message) {
    statusMessage.textContent = message;
  }

  // ==========================================
  // ATUALIZA OS NOMES EM TEMPO REAL
  // ==========================================

  function updateNames() {
    const names = namesInput.value.trim();

    cardNames.textContent = names || "Seu nome aqui";
    nameCount.textContent = namesInput.value.length;
  }

  // ==========================================
  // ATUALIZA A MENSAGEM OPCIONAL
  // ==========================================

  function updateMessage() {
    const message = messageInput.value.trim();

    cardMessage.textContent = message;
    cardMessage.hidden = !message;
  }

  // ==========================================
  // CARREGA A FOTO DO CASAL
  // ==========================================

  
function loadPhoto(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Escolha um arquivo de imagem válido.");
    photoInput.value = "";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    setStatus("A imagem deve ter até 15 MB. Escolha uma foto menor.");
    photoInput.value = "";
    return;
  }

  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
  }

  currentPhotoUrl = URL.createObjectURL(file);

  // Aguarda a foto carregar antes de confirmar.
  photoPreview.onload = () => {
    photoPreview.hidden = false;
    photoPlaceholder.hidden = true;

    setStatus("✓ Foto escolhida com sucesso!");

    // Atualiza também o texto do botão de seleção.
    const uploadLabel = document.querySelector(
      'label.upload-control[for="couplePhoto"]'
    );

    if (uploadLabel) {
      uploadLabel.innerHTML = `
        <span class="upload-icon">✓</span>
        <span>Foto escolhida com sucesso!</span>
      `;

      uploadLabel.classList.add("photo-selected");
    }
  };

  photoPreview.onerror = () => {
    photoPreview.hidden = true;
    photoPlaceholder.hidden = false;

    setStatus("Não foi possível abrir a foto. Tente outra imagem.");
  };

  photoPreview.src = currentPhotoUrl;
}


  // ==========================================
  // CRIA UM NOME SEGURO PARA O ARQUIVO
  // ==========================================

  function safeFileName(value) {
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return normalized || "encontro-de-casais";
  }

  // ==========================================
  // GERA A IMAGEM DO CARD
  // ==========================================

  async function renderCardCanvas() {
    if (typeof window.html2canvas !== "function") {
      throw new Error(
        "A biblioteca de imagem não carregou. Verifique sua conexão com a internet e atualize a página."
      );
    }

    // Aguarda a foto terminar de carregar.
    if (!photoPreview.hidden && !photoPreview.complete) {
      await new Promise((resolve, reject) => {
        photoPreview.addEventListener("load", resolve, {
          once: true
        });

        photoPreview.addEventListener("error", reject, {
          once: true
        });
      });
    }

    // Captura somente o card vertical.
    return await window.html2canvas(card, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false,
      width: card.offsetWidth,
      height: card.offsetHeight,
      scrollX: 0,
      scrollY: 0
    });
  }

  // ==========================================
  // CONVERTE A IMAGEM PARA PNG
  // ==========================================

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Não foi possível criar a imagem PNG."));
        }
      }, "image/png");
    });
  }

  // ==========================================
  // BAIXA A IMAGEM
  // ==========================================

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `nos-vamos-${safeFileName(namesInput.value)}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  async function downloadCard() {
    downloadButton.disabled = true;

    setStatus("Preparando seu card em PNG...");

    try {
      const canvas = await renderCardCanvas();
      const blob = await canvasToBlob(canvas);

      downloadBlob(blob);

      setStatus(
        "Card NÓS VAMOS! baixado! Pronto para publicar nos Status."
      );
    } catch (error) {
      console.error(error);

      setStatus(
        error.message ||
        "Não foi possível gerar a imagem. Tente novamente."
      );
    } finally {
      downloadButton.disabled = false;
    }
  }

  // ==========================================
  // COMPARTILHA PELO WHATSAPP
  // ==========================================

  async function shareOnWhatsApp() {
    whatsappButton.disabled = true;

    setStatus("Preparando o compartilhamento...");

    const names = namesInput.value.trim();
    const custom = messageInput.value.trim();

    const shareText = [
      "NÓS VAMOS! ❤️",

      names
        ? `${names} estarão no Encontro de Casais!`
        : "Estaremos juntos no Encontro de Casais!",

      custom,

      "📅 14 de novembro de 2026, às 19h",

      "📍 Local a confirmar",

      "Colossenses 3:14"
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const canvas = await renderCardCanvas();
      const blob = await canvasToBlob(canvas);

      const file = new File(
        [blob],
        `nos-vamos-${safeFileName(names)}.png`,
        { type: "image/png" }
      );

      // Em celulares e navegadores compatíveis,
      // permite compartilhar o PNG diretamente.
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Nós Vamos! — Encontro de Casais",
          text: shareText
        });

        setStatus(
          "Compartilhamento aberto. Selecione o WhatsApp na lista de aplicativos."
        );
      } else {
        // Alternativa para navegadores sem compartilhamento
        // de arquivos: baixa o card e abre o WhatsApp.
        downloadBlob(blob);

        const whatsappUrl =
          "https://wa.me/?text=" +
          encodeURIComponent(
            shareText +
            "\n\nAnexe o card PNG que acabou de baixar."
          );

        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer"
        );

        setStatus(
          "O card foi baixado e o WhatsApp foi aberto. Anexe a imagem à conversa."
        );
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Compartilhamento cancelado.");
      } else {
        console.error(error);

        setStatus(
          "Não foi possível compartilhar automaticamente. Baixe o PNG e envie pelo WhatsApp."
        );
      }
    } finally {
      whatsappButton.disabled = false;
    }
  }

  // ==========================================
  // EVENTOS DOS CAMPOS E BOTÕES
  // ==========================================

  photoInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    loadPhoto(file);
  });

  namesInput.addEventListener("input", updateNames);

  messageInput.addEventListener("input", updateMessage);

  downloadButton.addEventListener("click", downloadCard);

  whatsappButton.addEventListener("click", shareOnWhatsApp);

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  updateNames();
  updateMessage();

})();
