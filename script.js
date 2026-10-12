
(() => {
  "use strict";

  // ========================================
  // ELEMENTOS DA PÁGINA
  // ========================================

  const photoInput = document.getElementById("couplePhoto");
  const uploadButton = document.getElementById("uploadButton");
  const uploadIcon = document.getElementById("uploadIcon");
  const uploadText = document.getElementById("uploadText");

  const photoPreview = document.getElementById("photoPreview");
  const photoPlaceholder = document.getElementById("photoPlaceholder");

  const namesInput = document.getElementById("coupleNames");
  const messageInput = document.getElementById("customMessage");

  const cardNames = document.getElementById("cardNames");
  const cardMessage = document.getElementById("cardMessage");
  const nameCount = document.getElementById("nameCount");

  const card = document.getElementById("shareCard");
  const downloadButton = document.getElementById("downloadButton");
  const whatsappButton = document.getElementById("whatsappButton");
  const statusMessage = document.getElementById("statusMessage");

  let currentPhotoUrl = null;
  let photoRequestId = 0;

  // ========================================
  // MENSAGEM DE STATUS
  // ========================================

  function setStatus(message, type = "success") {
    statusMessage.textContent = message;
    statusMessage.dataset.type = type;
  }

  // ========================================
  // CONFERE SE OS ELEMENTOS EXISTEM
  // ========================================

  const requiredElements = [
    photoInput,
    uploadButton,
    uploadIcon,
    uploadText,
    photoPreview,
    photoPlaceholder,
    namesInput,
    messageInput,
    cardNames,
    cardMessage,
    nameCount,
    card,
    downloadButton,
    whatsappButton,
    statusMessage
  ];

  if (requiredElements.some((element) => !element)) {
    console.error(
      "Algum elemento do HTML não foi encontrado. Confira os IDs do index.html."
    );
    return;
  }

  // ========================================
  // ATUALIZA OS NOMES
  // ========================================

  function updateNames() {
    const names = namesInput.value.trim();

    cardNames.textContent = names || "Seu nome aqui";
    nameCount.textContent = namesInput.value.length;
  }

  // ========================================
  // ATUALIZA A MENSAGEM OPCIONAL
  // ========================================

  function updateMessage() {
    const message = messageInput.value.trim();

    cardMessage.textContent = message;
    cardMessage.hidden = !message;
  }

  // ========================================
  // RESTAURA O BOTÃO DE ESCOLHA DE FOTO
  // ========================================

  function resetUploadButton() {
    uploadText.textContent = "Escolher foto";
    uploadIcon.textContent = "+";
    uploadButton.classList.remove("photo-selected");
  }

  // ========================================
  // ESCOLHE E CARREGA A FOTO DO CASAL
  // ========================================

  function loadPhoto(file) {
    if (!file) return;

    const currentRequest = ++photoRequestId;

    // Verifica o formato.
    if (!file.type.startsWith("image/")) {
      setStatus(
        "Escolha um arquivo de imagem válido.",
        "error"
      );

      photoInput.value = "";
      return;
    }

    // Limita o tamanho a 15 MB.
    if (file.size > 15 * 1024 * 1024) {
      setStatus(
        "A imagem deve ter até 15 MB. Escolha uma foto menor.",
        "error"
      );

      photoInput.value = "";
      return;
    }

    const newPhotoUrl = URL.createObjectURL(file);

    // Aguarda a nova imagem ser carregada.
    const imageLoader = new Image();

    imageLoader.onload = () => {
      // Ignora uma seleção antiga se outra foto foi escolhida.
      if (currentRequest !== photoRequestId) {
        URL.revokeObjectURL(newPhotoUrl);
        return;
      }

      // Libera a URL da foto anterior.
      if (currentPhotoUrl) {
        URL.revokeObjectURL(currentPhotoUrl);
      }

      currentPhotoUrl = newPhotoUrl;

      photoPreview.src = currentPhotoUrl;
      photoPreview.hidden = false;
      photoPlaceholder.hidden = true;

      // ALTERAÇÃO PRINCIPAL:
      // O próprio botão mostra a confirmação.
      uploadIcon.textContent = "✓";
      uploadText.textContent = "Foto escolhida com sucesso!";
      uploadButton.classList.add("photo-selected");

      setStatus(
        "Foto escolhida com sucesso! A prévia já foi atualizada."
      );
    };

    imageLoader.onerror = () => {
      URL.revokeObjectURL(newPhotoUrl);

      if (currentRequest !== photoRequestId) {
        return;
      }

      photoInput.value = "";

      setStatus(
        "Não foi possível abrir essa foto. Tente outra imagem.",
        "error"
      );
    };

    imageLoader.src = newPhotoUrl;
  }

  // ========================================
  // NOME DO ARQUIVO PNG
  // ========================================

  function safeFileName(value) {
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || "encontro-de-casais";
  }

  // ========================================
  // PREPARA O CARD PARA EXPORTAÇÃO
  // ========================================

  async function renderCardCanvas() {
    if (typeof window.html2canvas !== "function") {
      throw new Error(
        "A biblioteca de PNG não carregou. Verifique sua conexão e atualize a página."
      );
    }

    // Aguarda a imagem selecionada estar pronta.
    if (
      !photoPreview.hidden &&
      (!photoPreview.complete || photoPreview.naturalWidth === 0)
    ) {
      await new Promise((resolve, reject) => {
        photoPreview.addEventListener("load", resolve, {
          once: true
        });

        photoPreview.addEventListener("error", reject, {
          once: true
        });
      });
    }

    // Renderiza somente o card, não a página inteira.
    return window.html2canvas(card, {
      backgroundColor: "#fffaf3",
      scale: 3,
      useCORS: true,
      logging: false,
      width: card.offsetWidth,
      height: card.offsetHeight,
      scrollX: 0,
      scrollY: 0
    });
  }

  // ========================================
  // CONVERTE CANVAS EM PNG
  // ========================================

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error("Não foi possível criar o arquivo PNG.")
          );
        }
      }, "image/png");
    });
  }

  // ========================================
  // BAIXA O ARQUIVO
  // ========================================

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
    }, 2000);
  }

  // ========================================
  // BOTÃO BAIXAR PNG
  // ========================================

  async function downloadCard() {
    downloadButton.disabled = true;

    setStatus("Preparando seu card em PNG...");

    try {
      const canvas = await renderCardCanvas();
      const blob = await canvasToBlob(canvas);

      downloadBlob(blob);

      setStatus(
        "Card NÓS VAMOS! baixado. Pronto para publicar nos Status."
      );
    } catch (error) {
      console.error("Erro ao gerar o card:", error);

      setStatus(
        error.message || "Não foi possível gerar o PNG.",
        "error"
      );
    } finally {
      downloadButton.disabled = false;
    }
  }

  // ========================================
  // BOTÃO COMPARTILHAR NO WHATSAPP
  // ========================================

  async function shareOnWhatsApp() {
    whatsappButton.disabled = true;

    setStatus("Preparando o compartilhamento...");

    const names = namesInput.value.trim();
    const customMessage = messageInput.value.trim();

    const shareText = [
      "NÓS VAMOS! ❤️",
      names
        ? `${names} estarão no Encontro de Casais!`
        : "Estaremos juntos no Encontro de Casais!",
      customMessage,
      "Data: 14 de novembro de 2026, às 19h",
      "Local: em breve",
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

      // Compartilha o PNG diretamente quando o navegador permite.
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
          "Compartilhamento aberto. Selecione o WhatsApp."
        );
      } else {
        // Alternativa para navegadores sem suporte a arquivos.
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
          "Card baixado! No WhatsApp, anexe a imagem à conversa."
        );
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Compartilhamento cancelado.");
      } else {
        console.error("Erro ao compartilhar:", error);

        setStatus(
          "Não foi possível compartilhar automaticamente. Tente baixar o PNG.",
          "error"
        );
      }
    } finally {
      whatsappButton.disabled = false;
    }
  }

  // ========================================
  // EVENTOS
  // ========================================

  photoInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
      loadPhoto(file);
    }
  });

  namesInput.addEventListener("input", updateNames);

  messageInput.addEventListener("input", updateMessage);

  downloadButton.addEventListener("click", downloadCard);

  whatsappButton.addEventListener("click", shareOnWhatsApp);

  // ========================================
  // INICIALIZAÇÃO
  // ========================================

  updateNames();
  updateMessage();
  resetUploadButton();

})();
